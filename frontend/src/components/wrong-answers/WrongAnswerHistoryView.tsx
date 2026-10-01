import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { IWrongAnswer, IConfusionPairStat, IReviewRecommendation } from '@brain-exercises/shared';
import { WrongAnswerCard } from './WrongAnswerCard';
import { ConfusionMatrixChart } from './ConfusionMatrixChart';
import { ReviewRecommendationPanel } from './ReviewRecommendationPanel';
import { AuditoryProgressTimeline } from './AuditoryProgressTimeline';
import { WrongAnswerFilters } from './WrongAnswerFilters';
import { WrongAnswerReviewSession } from './WrongAnswerReviewSession';
import { 
  Flame, 
  RotateCcw, 
  CheckCircle2, 
  History, 
  Activity, 
  Sparkles, 
  Trash2, 
  ArrowLeft,
  Volume2,
  Trophy,
  HelpCircle,
  Layers
} from 'lucide-react';

export const WrongAnswerHistoryView: React.FC = () => {
  const { 
    wrongAnswers, 
    confusionStats, 
    progressSnapshots, 
    historyFilter, 
    setHistoryFilter, 
    clearWrongAnswerHistory,
    getReviewRecommendations,
    syncWrongAnswersFromBackend,
    setActiveTab
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'matrix' | 'timeline'>('list');
  const [activeReviewItem, setActiveReviewItem] = useState<IWrongAnswer | null>(null);
  const [activeReviewPairStat, setActiveReviewPairStat] = useState<IConfusionPairStat | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Try background sync once on mount
    syncWrongAnswersFromBackend();
  }, [syncWrongAnswersFromBackend]);

  const recommendations = useMemo(() => {
    return getReviewRecommendations();
  }, [getReviewRecommendations, wrongAnswers, confusionStats]);

  // Filter wrong answers according to current filter
  const filteredWrongAnswers = useMemo(() => {
    return wrongAnswers.filter(item => {
      // 1. Slug
      if (historyFilter.exerciseSlug !== 'ALL' && item.exerciseSlug !== historyFilter.exerciseSlug) {
        return false;
      }
      // 2. Severity
      if (historyFilter.severity !== 'ALL' && item.severity !== historyFilter.severity) {
        return false;
      }
      // 3. Review Status
      if (historyFilter.reviewStatus !== 'ALL' && item.reviewStatus !== historyFilter.reviewStatus) {
        return false;
      }
      // 4. Date Range
      if (historyFilter.dateRange !== 'all') {
        const itemDate = new Date(item.timestamp).getTime();
        const now = Date.now();
        if (historyFilter.dateRange === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (itemDate < startOfToday) return false;
        } else if (historyFilter.dateRange === 'week') {
          if (now - itemDate > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (historyFilter.dateRange === 'month') {
          if (now - itemDate > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }
      // 5. Search Query
      if (historyFilter.searchQuery && historyFilter.searchQuery.trim() !== '') {
        const q = historyFilter.searchQuery.toLowerCase();
        const matchLabel = item.correctAnswer.label.toLowerCase().includes(q) || item.userAnswer.label.toLowerCase().includes(q);
        const matchCode = item.correctAnswer.code.toLowerCase().includes(q) || item.userAnswer.code.toLowerCase().includes(q);
        const matchSlug = item.exerciseSlug.toLowerCase().includes(q);
        if (!matchLabel && !matchCode && !matchSlug) return false;
      }

      return true;
    });
  }, [wrongAnswers, historyFilter]);

  // Start review from a wrong answer card
  const handleStartReviewFromCard = (item: IWrongAnswer) => {
    setActiveReviewItem(item);
    setActiveReviewPairStat(null);
  };

  // Start review from recommendation or matrix pair
  const handleStartReviewFromRec = (rec: IReviewRecommendation) => {
    const matchingWrong = wrongAnswers.find(w => w.confusionPairKey === rec.confusionPairKey) || null;
    const matchingStat = confusionStats.find(s => s.pairKey === rec.confusionPairKey) || null;
    setActiveReviewItem(matchingWrong);
    setActiveReviewPairStat(matchingStat);
  };

  const handleStartReviewFromPairKey = (pairKey: string) => {
    const matchingWrong = wrongAnswers.find(w => w.confusionPairKey === pairKey) || null;
    const matchingStat = confusionStats.find(s => s.pairKey === pairKey) || null;
    setActiveReviewItem(matchingWrong);
    setActiveReviewPairStat(matchingStat);
  };

  // KPI Metrics
  const totalWrong = wrongAnswers.length;
  const masteredCount = wrongAnswers.filter(a => a.reviewStatus === 'mastered').length;
  const reviewingCount = wrongAnswers.filter(a => a.reviewStatus === 'reviewing').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('exercises')}
            className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-cyan-500 hover:border-cyan-500/50 transition-all shadow-sm active:scale-95"
            title="Quay lại danh sách bài tập"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Lịch Sử Câu Sai & Phát Triển Thính Giác
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                SRS Memory
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Chuyển hóa sai lầm thành phản xạ cảm âm chuẩn xác thông qua thuật toán lặp lại cách quãng
            </p>
          </div>
        </div>

        {totalWrong > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa lịch sử</span>
          </button>
        )}
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tổng câu sai</span>
            <History className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {totalWrong}
          </p>
          <span className="text-[11px] text-slate-500">Đã lưu trữ tự động</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Cặp hay nhầm</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {confusionStats.length}
          </p>
          <span className="text-[11px] text-slate-500">Trong ma trận nhầm lẫn</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Đang ôn tập</span>
            <RotateCcw className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {reviewingCount}
          </p>
          <span className="text-[11px] text-slate-500">Thuật toán SM-2</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Đã nắm vững</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {masteredCount}
          </p>
          <span className="text-[11px] text-slate-500">Mastered hoàn toàn</span>
        </div>
      </div>

      {/* Smart Review Recommendation Banner (If available) */}
      {recommendations.length > 0 && (
        <ReviewRecommendationPanel
          recommendations={recommendations}
          onStartReview={handleStartReviewFromRec}
        />
      )}

      {/* Subtab Navigation (List, Heatmap Matrix, Timeline) */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
              activeSubTab === 'list'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử câu sai ({filteredWrongAnswers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
              activeSubTab === 'matrix'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Ma trận nhiệt ({confusionStats.length} cặp)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
              activeSubTab === 'timeline'
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Tiến bộ thính giác</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Detailed List of Wrong Answers */}
      {activeSubTab === 'list' && (
        <div className="flex flex-col gap-4">
          <WrongAnswerFilters
            filter={historyFilter}
            onChange={setHistoryFilter}
            onReset={() =>
              setHistoryFilter({
                exerciseSlug: 'ALL',
                severity: 'ALL',
                reviewStatus: 'ALL',
                dateRange: 'all',
                searchQuery: ''
              })
            }
          />

          {filteredWrongAnswers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Không tìm thấy câu sai nào phù hợp!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Bạn chưa có câu sai nào thuộc bộ lọc này hoặc các lỗi đã được bạn ôn tập và nắm vững.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredWrongAnswers.map(item => (
                <WrongAnswerCard
                  key={item.id}
                  wrongAnswer={item}
                  onStartReview={handleStartReviewFromCard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Confusion Matrix Heatmap */}
      {activeSubTab === 'matrix' && (
        <ConfusionMatrixChart
          confusionStats={confusionStats}
          selectedSlug={historyFilter.exerciseSlug}
          onSelectPair={handleStartReviewFromPairKey}
        />
      )}

      {/* Tab 3: Auditory Progress Timeline */}
      {activeSubTab === 'timeline' && (
        <AuditoryProgressTimeline snapshots={progressSnapshots} />
      )}

      {/* Review Session Modal */}
      {(activeReviewItem || activeReviewPairStat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <WrongAnswerReviewSession
            initialWrongAnswer={activeReviewItem}
            confusionPairStat={activeReviewPairStat}
            onClose={() => {
              setActiveReviewItem(null);
              setActiveReviewPairStat(null);
            }}
          />
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Xóa toàn bộ lịch sử câu sai?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Thao tác này sẽ xóa các bản ghi câu sai và thiết lập lại ma trận nhầm lẫn. Dữ liệu không thể khôi phục.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  clearWrongAnswerHistory('ALL');
                  setShowClearConfirm(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/30"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
