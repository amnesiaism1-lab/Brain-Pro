import React from 'react';
import { MultiEnumParamField } from '@brain-exercises/shared';
import { Check } from 'lucide-react';

interface MultiEnumFieldProps {
  field: MultiEnumParamField;
  value: string[];
  onChange: (val: string[]) => void;
}

export const MultiEnumField: React.FC<MultiEnumFieldProps> = ({ field, value, onChange }) => {
  const currentVal = Array.isArray(value) ? value : field.default;
  const minCount = field.minSelected ?? 1;

  const toggleItem = (itemVal: string) => {
    if (currentVal.includes(itemVal)) {
      if (currentVal.length > minCount) {
        onChange(currentVal.filter(v => v !== itemVal));
      }
    } else {
      onChange([...currentVal, itemVal]);
    }
  };

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
        <span className="text-[10px] text-slate-400 font-mono">
          Đã chọn: {currentVal.length}/{field.options.length} (Tối thiểu: {minCount})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
        {field.options.map((opt) => {
          const isSelected = currentVal.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleItem(opt.value)}
              className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold shadow-xs'
                  : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="truncate pr-1">{opt.labelVi}</span>
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-transparent'
              }`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
