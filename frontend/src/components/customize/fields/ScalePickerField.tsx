import React, { useState, useMemo } from 'react';
import { 
  ScaleRefParamField, 
  ALL_SCALE_CORES, 
  SCALE_CATALOG, 
  ScaleCategory,
  VOCAL_RECOMMENDED_SCALE_IDS 
} from '@brain-exercises/shared';
import { Search, Check, Music, Sparkles } from 'lucide-react';

interface ScalePickerFieldProps {
  field: ScaleRefParamField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
}

const CATEGORY_TABS: Array<{ id: ScaleCategory | 'ALL' | 'VOCAL'; label: string }> = [
  { id: 'VOCAL', label: '⭐ Khuyên Dùng (14)' },
  { id: 'ALL', label: 'Tất Cả (32)' },
  { id: 'CHURCH_MODES', label: 'Điệu Thức Tự Nhiên' },
  { id: 'MINOR_MODES', label: 'Họ Thứ & Phái Sinh' },
  { id: 'PENTATONIC_BLUES', label: 'Ngũ Cung & Blues' },
  { id: 'VIETNAMESE', label: '🇻🇳 Ngũ Cung VN' },
  { id: 'SYMMETRIC', label: 'Đối Xứng' },
  { id: 'WORLD_EXOTIC', label: 'Thế Giới' }
];

export const ScalePickerField: React.FC<ScalePickerFieldProps> = ({ field, value, onChange }) => {
  const [activeCategory, setActiveCategory] = useState<ScaleCategory | 'ALL' | 'VOCAL'>('VOCAL');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedList = useMemo<string[]>(() => {
    if (field.multi) {
      return Array.isArray(value) ? value : [value as string];
    }
    return typeof value === 'string' && value ? [value] : ['major'];
  }, [field.multi, value]);

  const filteredScales = useMemo(() => {
    return ALL_SCALE_CORES.filter(scale => {
      // Category filter
      if (activeCategory === 'VOCAL') {
        if (!VOCAL_RECOMMENDED_SCALE_IDS.includes(scale.id)) return false;
      } else if (activeCategory !== 'ALL' && scale.category !== activeCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          scale.nameVi.toLowerCase().includes(q) ||
          scale.name.toLowerCase().includes(q) ||
          scale.mode.toLowerCase().includes(q) ||
          scale.feel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectScale = (scaleId: string) => {
    if (!field.multi) {
      onChange(scaleId);
      return;
    }

    if (selectedList.includes(scaleId)) {
      if (selectedList.length > 1) {
        onChange(selectedList.filter(id => id !== scaleId));
      }
    } else {
      onChange([...selectedList, scaleId]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (!field.multi) return;
    const ids = filteredScales.map(s => s.id);
    const merged = Array.from(new Set([...selectedList, ...ids]));
    onChange(merged);
  };

  const handleSelectOnlyVocalRecommended = () => {
    if (!field.multi) return;
    onChange([...VOCAL_RECOMMENDED_SCALE_IDS]);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/80 border border-[#D5CBB9] dark:border-slate-800 shadow-md dark:shadow-xl">
      {/* Header Readout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D5CBB9]/60 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <label className="text-sm font-bold text-slate-800 dark:text-white">
              {field.labelVi}
            </label>
          </div>
          {field.descriptionVi && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{field.descriptionVi}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
            {field.multi ? `Đã chọn: ${selectedList.length} âm giai` : `Đang chọn: ${SCALE_CATALOG[selectedList[0]]?.nameVi || selectedList[0]}`}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons for Multi-select */}
      {field.multi && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectOnlyVocalRecommended}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50 dark:border-emerald-500/40 hover:bg-emerald-500/25 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>Kho Chuẩn Thanh Nhạc (14 Scale)</span>
          </button>
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Chọn tất cả tab này
          </button>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên âm giai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Scale Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
        {filteredScales.map(scale => {
          const isSelected = selectedList.includes(scale.id);
          return (
            <button
              key={scale.id}
              type="button"
              onClick={() => handleSelectScale(scale.id)}
              className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {scale.nameVi}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {scale.intervals.length} nốt
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6 line-clamp-1">
                {scale.feel}
              </div>

              <div className="flex items-center gap-1.5 mt-2 pl-6">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400">
                  {scale.intervalFormula}
                </span>
                {scale.vocalFriendly && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                    Vocal
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
