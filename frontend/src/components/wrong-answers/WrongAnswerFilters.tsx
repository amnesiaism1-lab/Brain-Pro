import React from 'react';
import { IWrongAnswerFilter, ExerciseSlug, ErrorSeverity } from '@brain-exercises/shared';
import { Search, Filter, X } from 'lucide-react';

interface WrongAnswerFiltersProps {
  filter: IWrongAnswerFilter;
  onChange: (filter: Partial<IWrongAnswerFilter>) => void;
  onReset: () => void;
  className?: string;
}

const EXERCISE_OPTIONS: Array<{ slug: ExerciseSlug | 'ALL'; label: string }> = [
  { slug: 'ALL', label: 'Tất cả bài tập' },
  { slug: 'interval-identify', label: 'Nhận Diện Quãng' },
  { slug: 'chord-identify', label: 'Nhận Diện Hợp Âm' },
  { slug: 'pitch-recall', label: 'Nhớ Cao Độ' },
  { slug: 'timbre-match', label: 'Phân Biệt Âm Sắc' },
  { slug: 'rhythm-recall', label: 'Nhớ Nhịp Điệu' },
  { slug: 'sound-localization', label: 'Định Vị 3D' },
  { slug: 'vocal-pitch-match', label: 'Dò Cao Độ Giọng Hát' }
];

export const WrongAnswerFilters: React.FC<WrongAnswerFiltersProps> = ({
  filter,
  onChange,
  onReset,
  className = ''
}) => {
  const isFiltered =
    filter.exerciseSlug !== 'ALL' ||
    filter.severity !== 'ALL' ||
    filter.reviewStatus !== 'ALL' ||
    filter.dateRange !== 'all' ||
    Boolean(filter.searchQuery);

  return (
    <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col gap-3.5 ${className}`}>
      {/* Top Search bar & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên quãng, hợp âm, nốt, âm sắc..."
            value={filter.searchQuery || ''}
            onChange={e => onChange({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1 active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      {/* Filter Row 1: Exercise Slug Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {EXERCISE_OPTIONS.map(opt => {
          const isActive = filter.exerciseSlug === opt.slug;
          return (
            <button
              key={opt.slug}
              onClick={() => onChange({ exerciseSlug: opt.slug })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20 font-bold'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Filter Row 2: Severity, Status & Date Range Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
        {/* Severity */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Mức độ:</span>
          <select
            value={filter.severity}
            onChange={e => onChange({ severity: e.target.value as ErrorSeverity | 'ALL' })}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="minor">Nhẹ (Tinh chỉnh)</option>
            <option value="moderate">Trung bình</option>
            <option value="critical">Nghiêm trọng (Cần chú ý)</option>
          </select>
        </div>

        {/* Review Status */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái:</span>
          <select
            value={filter.reviewStatus}
            onChange={e => onChange({ reviewStatus: e.target.value as any })}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="new">Câu mới</option>
            <option value="reviewing">Đang ôn tập</option>
            <option value="mastered">Đã nắm vững</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian:</span>
          <select
            value={filter.dateRange}
            onChange={e => onChange({ dateRange: e.target.value as any })}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Toàn bộ thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
          </select>
        </div>
      </div>
    </div>
  );
};
