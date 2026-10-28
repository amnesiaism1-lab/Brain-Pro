import React, { useState, useEffect, useMemo } from 'react';
import { 
  ExerciseSlug, 
  getExerciseModes, 
  getExerciseMode, 
  getDefaultParams, 
  validateAndSanitizeParams, 
  isFieldVisible, 
  ICustomExercisePreset,
  IParamSchema
} from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { ModePicker } from './ModePicker';
import { PresetBar } from './PresetBar';
import { NumberField } from './fields/NumberField';
import { EnumField } from './fields/EnumField';
import { MultiEnumField } from './fields/MultiEnumField';
import { BooleanField } from './fields/BooleanField';
import { ScalePickerField } from './fields/ScalePickerField';
import { NotePickerField } from './fields/NotePickerField';
import { Play, Sparkles, Sliders, Timer, Hash } from 'lucide-react';

interface CustomizePanelProps {
  exerciseSlug: ExerciseSlug;
  onStartCustomGame: () => void;
}

export const CustomizePanel: React.FC<CustomizePanelProps> = ({ exerciseSlug, onStartCustomGame }) => {
  const {
    customPresets,
    activeCustomPresetIdBySlug,
    saveCustomPreset,
    deleteCustomPreset,
    setActiveCustomPreset,
    getActiveCustomPreset,
    setActiveSessionSource,
    playSound
  } = useAppStore();

  const presetsForExercise = customPresets[exerciseSlug] || [];
  const activePreset = getActiveCustomPreset(exerciseSlug);

  // Available modes for this exercise
  const modes = useMemo(() => getExerciseModes(exerciseSlug), [exerciseSlug]);
  const defaultModeId = activePreset?.modeId || modes[0]?.id || `${exerciseSlug}.standard`;

  const [selectedModeId, setSelectedModeId] = useState<string>(defaultModeId);
  const activeMode = useMemo(() => getExerciseMode(exerciseSlug, selectedModeId), [exerciseSlug, selectedModeId]);

  // Current working parameters
  const [currentParams, setCurrentParams] = useState<Record<string, unknown>>(() => {
    if (activePreset && activePreset.modeId === defaultModeId) {
      return { ...activePreset.params };
    }
    return getDefaultParams(activeMode.schema);
  });

  // Session settings (rounds, time limit)
  const [rounds, setRounds] = useState<number>(() => activePreset?.session.rounds ?? 3);
  const [timeLimitSec, setTimeLimitSec] = useState<number | null>(() => activePreset?.session.timeLimitSec ?? 45);

  // Sync when active preset changes from PresetBar
  const handleSelectPreset = (presetId: string | null) => {
    setActiveCustomPreset(exerciseSlug, presetId);
    if (presetId) {
      const found = presetsForExercise.find(p => p.id === presetId);
      if (found) {
        setSelectedModeId(found.modeId);
        setCurrentParams({ ...found.params });
        setRounds(found.session.rounds);
        setTimeLimitSec(found.session.timeLimitSec);
      }
    }
  };

  const handleSelectMode = (modeId: string) => {
    setSelectedModeId(modeId);
    const newMode = getExerciseMode(exerciseSlug, modeId);
    setCurrentParams(getDefaultParams(newMode.schema));
  };

  const handleApplyBuiltInPreset = (presetParams: Record<string, unknown>) => {
    setCurrentParams(prev => ({
      ...prev,
      ...presetParams
    }));
  };

  const handleResetToDefaults = () => {
    setCurrentParams(getDefaultParams(activeMode.schema));
    setRounds(3);
    setTimeLimitSec(45);
  };

  const handleSaveCurrentPreset = (name: string) => {
    const newPreset: ICustomExercisePreset = {
      id: `preset-${Date.now()}`,
      exerciseSlug,
      modeId: selectedModeId,
      name,
      schemaVersion: activeMode.schema.version,
      params: currentParams,
      session: {
        rounds,
        timeLimitSec
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveCustomPreset(newPreset);
    playSound('correct');
  };

  const handleDeletePreset = (presetId: string) => {
    deleteCustomPreset(exerciseSlug, presetId);
  };

  const updateParam = (key: string, val: unknown) => {
    setCurrentParams(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleStartPractice = () => {
    // Save current working parameters into active preset (or auto-preset if none selected)
    const presetToUse: ICustomExercisePreset = {
      id: activePreset?.id || `preset-active-${exerciseSlug}`,
      exerciseSlug,
      modeId: selectedModeId,
      name: activePreset?.name || 'Tùy chỉnh hiện tại',
      schemaVersion: activeMode.schema.version,
      params: currentParams,
      session: {
        rounds,
        timeLimitSec
      },
      createdAt: activePreset?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveCustomPreset(presetToUse);
    setActiveCustomPreset(exerciseSlug, presetToUse.id);
    setActiveSessionSource('custom');
    onStartCustomGame();
  };

  return (
    <div className="flex flex-col gap-5 py-2 animate-fadeIn">
      {/* 1. Mode Selector (Dạng bài) */}
      <ModePicker
        exerciseSlug={exerciseSlug}
        selectedModeId={selectedModeId}
        onSelectMode={handleSelectMode}
        onApplyBuiltInPreset={handleApplyBuiltInPreset}
      />

      {/* 2. Preset Bar */}
      <PresetBar
        exerciseSlug={exerciseSlug}
        presets={presetsForExercise}
        activePresetId={activePreset?.id || null}
        onSelectPreset={handleSelectPreset}
        onSavePreset={handleSaveCurrentPreset}
        onDeletePreset={handleDeletePreset}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* 3. Dynamic Parameter Form */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Thông Số Luyện Tập ({activeMode.labelVi})
          </h3>
        </div>

        {activeMode.schema.fields.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            Dạng bài này sử dụng các thông số thời gian và vòng tập tùy chỉnh dưới đây.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeMode.schema.fields.map(field => {
              if (!isFieldVisible(field.key, currentParams, activeMode.schema)) {
                return null;
              }

              const val = currentParams[field.key];

              switch (field.kind) {
                case 'number':
                  return (
                    <NumberField
                      key={field.key}
                      field={field}
                      value={val as number}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                case 'enum':
                  return (
                    <EnumField
                      key={field.key}
                      field={field}
                      value={val as string}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                case 'multiEnum':
                  return (
                    <MultiEnumField
                      key={field.key}
                      field={field}
                      value={val as string[]}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                case 'boolean':
                  return (
                    <BooleanField
                      key={field.key}
                      field={field}
                      value={val as boolean}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                case 'scaleRef':
                  return (
                    <ScalePickerField
                      key={field.key}
                      field={field}
                      value={val as string | string[]}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                case 'noteRef':
                  return (
                    <NotePickerField
                      key={field.key}
                      field={field}
                      value={val as string | string[]}
                      onChange={(newVal) => updateParam(field.key, newVal)}
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>

      {/* 4. Session Controls (Rounds & Time Limit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Rounds */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-bold text-slate-200">
              Số vòng tập trong phiên
            </label>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[3, 5, 8, 10, 15].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRounds(r)}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  rounds === r
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Time Limit */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-bold text-slate-200">
              Thời gian giới hạn
            </label>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: '30s', val: 30 },
              { label: '45s', val: 45 },
              { label: '60s', val: 60 },
              { label: '90s', val: 90 },
              { label: 'Tự do', val: null }
            ].map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => setTimeLimitSec(t.val)}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  timeLimitSec === t.val
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Start Practice CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartPractice}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm md:text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>BẮT ĐẦU LUYỆN TẬP TÙY CHỈNH</span>
        </button>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          Chế độ tùy chỉnh giúp bạn tự do rèn luyện mà không làm ảnh hưởng cấp độ DDA chính của bài tập.
        </p>
      </div>
    </div>
  );
};
