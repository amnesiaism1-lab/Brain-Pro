import React from 'react';
import { Trophy, CheckCircle2, Clock, Sparkles, X, Dumbbell } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EXERCISES_METADATA } from '@brain-exercises/shared';

export const RoutineSummaryModal: React.FC = () => {
  const { routineSummary, dismissRoutineSummary, playSound } = useAppStore();

  if (!routineSummary) return null;

  const { routine } = routineSummary;

  const handleClose = () => {
    playSound('click');
    dismissRoutineSummary();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl shadow-inner backdrop-blur-sm">
              <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Hoàn Thành Lộ Trình
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {routine.title}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Đóng"
            className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Thời lượng</span>
                <p className="text-base font-black text-slate-900 dark:text-white">{routine.durationMinutes} Phút</p>
              </div>
            </div>

            <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 dark:bg-cyan-400/20 rounded-xl text-cyan-600 dark:text-cyan-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Số bài tập</span>
                <p className="text-base font-black text-slate-900 dark:text-white">{routine.items.length} Bài</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi tiết chặng rèn luyện đã hoàn thành
            </h4>
            <div className="space-y-2">
              {routine.items.map((item, idx) => {
                const ex = EXERCISES_METADATA.find(e => e.slug === item.exerciseSlug);
                return (
                  <div
                    key={`${item.exerciseSlug}-${idx}`}
                    className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {ex?.title || item.exerciseSlug}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ex?.categoryName || 'Rèn luyện nhận thức'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{Math.round(item.recommendedDurationSec / 60) || 1}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
              Bạn đã hoàn thành trọn vẹn chuỗi rèn luyện! Tính dẻo não bộ (neuroplasticity) được củng cố tốt nhất qua thói quen luyện tập đa kích thích mỗi ngày.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Tuyệt Vời & Tiếp Tục
          </button>
        </div>
      </div>
    </div>
  );
};
