import React, { useState } from 'react';
import { ExerciseSlug, ICustomExercisePreset } from '@brain-exercises/shared';
import { Bookmark, Plus, Trash2, Check, RotateCcw } from 'lucide-react';

interface PresetBarProps {
  exerciseSlug: ExerciseSlug;
  presets: ICustomExercisePreset[];
  activePresetId: string | null;
  onSelectPreset: (presetId: string | null) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (presetId: string) => void;
  onResetToDefaults: () => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  exerciseSlug,
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onResetToDefaults
}) => {
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    setIsNamingOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">
            Cấu hình đã lưu (Presets)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Khôi phục thông số mặc định của dạng bài này"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNamingOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Lưu Preset Mới</span>
          </button>
        </div>
      </div>

      {/* Preset Name Dialog */}
      {isNamingOpen && (
        <form onSubmit={handleSaveSubmit} className="flex items-center gap-2 pt-2 border-t border-slate-800/80 animate-fadeIn">
          <input
            type="text"
            autoFocus
            placeholder="Tên preset (ví dụ: Khởi Động Scale C, Luyện Quãng 3...)"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => setIsNamingOpen(false)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
          >
            Hủy
          </button>
        </form>
      )}

      {/* Preset Pills List */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {presets.map(p => {
            const isActive = activePresetId === p.id;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectPreset(p.id)}
                  className="flex items-center gap-1.5"
                >
                  <Bookmark className={`w-3 h-3 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  <span>{p.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePreset(p.id)}
                  className="ml-1 p-0.5 text-slate-500 hover:text-rose-400 rounded-md transition"
                  title="Xóa preset này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
