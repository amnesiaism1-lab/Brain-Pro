import React from 'react';
import { ExerciseSlug, getExerciseModes, IExerciseModeDefinition } from '@brain-exercises/shared';
import { Sparkles, Layers, ShieldCheck, Clock } from 'lucide-react';

interface ModePickerProps {
  exerciseSlug: ExerciseSlug;
  selectedModeId: string;
  onSelectMode: (modeId: string) => void;
  onApplyBuiltInPreset?: (presetParams: Record<string, unknown>) => void;
}

export const ModePicker: React.FC<ModePickerProps> = ({
  exerciseSlug,
  selectedModeId,
  onSelectMode,
  onApplyBuiltInPreset
}) => {
  const modes = getExerciseModes(exerciseSlug);

  if (modes.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Dạng Bài Tập (Exercise Modes)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {modes.length} dạng bài có sẵn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {modes.map(mode => {
          const isSelected = selectedModeId === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-slate-700'
                  }`} />
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {mode.labelVi}
                  </h4>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  mode.status === 'stable'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  {mode.status === 'stable' ? 'Chuẩn' : 'Thử nghiệm'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1 pl-4.5 leading-snug">
                {mode.descriptionVi}
              </p>

              {/* Built-in Presets Shortcuts */}
              {mode.builtInPresets && mode.builtInPresets.length > 0 && (
                <div className="mt-3 pl-4.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Mẫu nhanh:
                  </span>
                  {mode.builtInPresets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMode(mode.id);
                        if (onApplyBuiltInPreset) {
                          onApplyBuiltInPreset(preset.params as Record<string, unknown>);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition"
                      title={preset.descriptionVi}
                    >
                      {preset.labelVi}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
