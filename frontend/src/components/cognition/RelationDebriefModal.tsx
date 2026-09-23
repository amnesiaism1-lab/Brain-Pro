import React from 'react';
import { 
  COGNITIVE_RELATIONS, 
  RelationId, 
  IRelationEvent,
  ALL_RELATION_IDS 
} from '@brain-exercises/shared';
import { 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';

interface DebriefProps {
  events: IRelationEvent[];
  onClose: () => void;
}

export const RelationDebriefModal: React.FC<DebriefProps> = ({ events, onClose }) => {
  if (!events || events.length === 0) return null;

  // Group events by relationId
  const relationStats: Partial<Record<RelationId, { total: number; correct: number; avgMs: number }>> = {};

  events.forEach(ev => {
    if (!relationStats[ev.relationId]) {
      relationStats[ev.relationId] = { total: 0, correct: 0, avgMs: 0 };
    }
    const stat = relationStats[ev.relationId]!;
    stat.total += 1;
    if (ev.correct) stat.correct += 1;
    stat.avgMs += (ev.responseMs || 500);
  });

  const relationSummary = Object.entries(relationStats).map(([id, s]) => {
    const relId = id as RelationId;
    const def = COGNITIVE_RELATIONS[relId] || { nameVi: relId, definition: '' };
    const acc = Math.round((s.correct / s.total) * 100);
    const meanMs = Math.round(s.avgMs / s.total);
    return {
      id: relId,
      nameVi: def.nameVi,
      definition: def.definition,
      total: s.total,
      correct: s.correct,
      accuracy: acc,
      avgMs: meanMs,
      isStrong: acc >= 80,
      isNeedsWork: acc < 70
    };
  });

  // Sort: strong first, then needs work
  relationSummary.sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                Phân Tích Nhận Thức Lượt Chơi
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Đánh giá theo đơn vị quan hệ nhận thức thực nghiệm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Relation Breakdown List */}
        <div className="space-y-3">
          {relationSummary.map(item => (
            <div 
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.isStrong 
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                  : item.isNeedsWork
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {item.isStrong ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : item.isNeedsWork ? (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-brand-600 shrink-0" />
                  )}
                  <span className="font-black text-sm text-slate-800 dark:text-white">
                    {item.nameVi}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className={item.isStrong ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                    {item.accuracy}% đúng
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    ~{item.avgMs}ms
                  </span>
                </div>
              </div>

              {/* Cognitive Debrief sentence */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.isStrong 
                  ? `Khả năng xử lý ${item.nameVi.toLowerCase()} rất vững, phản xạ nhạy và duy trì sự ổn định cao.`
                  : item.isNeedsWork
                  ? `Cần thêm bài tập để củng cố ${item.nameVi.toLowerCase()} khi xuất hiện yếu tố nhiễu hoặc đảo luật.`
                  : `Đang tích lũy dữ liệu phản xạ. Tiếp tục duy trì nhịp rèn luyện.`}
              </p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95"
          >
            Đã hiểu, tiếp tục rèn luyện
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
