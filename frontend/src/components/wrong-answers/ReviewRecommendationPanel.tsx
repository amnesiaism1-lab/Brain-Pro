import React from 'react';
import { IReviewRecommendation } from '@brain-exercises/shared';
import { Sparkles, Clock, AlertTriangle, Play, CheckCircle, Zap } from 'lucide-react';

interface ReviewRecommendationPanelProps {
  recommendations: IReviewRecommendation[];
  onStartReview: (recommendation: IReviewRecommendation) => void;
  className?: string;
}

export const ReviewRecommendationPanel: React.FC<ReviewRecommendationPanelProps> = ({
  recommendations,
  onStartReview,
  className = ''
}) => {
  if (recommendations.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/30 text-center flex flex-col items-center justify-center gap-2 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Chưa có điểm yếu cần ưu tiên ôn tập khẩn cấp!
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Bạn đang duy trì độ nhạy bén rất tốt. Hãy tiếp tục luyện tập các bài tập thính giác để nâng cao độ khó!
        </p>
      </div>
    );
  }

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Ưu tiên cao
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Cần củng cố
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Gợi ý nhẹ
          </span>
        );
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Gợi Ý Ôn Tập Thông Minh (Smart Review)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thuật toán tự động phát hiện các cặp âm thanh gây bẫy thính giác của bạn
            </p>
          </div>
        </div>

        {recommendations.length > 0 && (
          <button
            onClick={() => onStartReview(recommendations[0])}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ôn mục ưu tiên nhất</span>
          </button>
        )}
      </div>

      {/* Recommendations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.slice(0, 4).map(rec => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/70 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                  {rec.confusionPairKey}
                </span>
                {getUrgencyBadge(rec.urgency)}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {rec.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {rec.reason}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                ~{rec.estimatedReviewMinutes} phút • Cấp {rec.suggestedLevel}
              </span>

              <button
                onClick={() => onStartReview(rec)}
                className="px-3 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-bold active:scale-95 transition-all flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                <span>Luyện ngay</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
