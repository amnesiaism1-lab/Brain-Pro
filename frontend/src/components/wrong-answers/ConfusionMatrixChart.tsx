import React, { useState, useMemo } from 'react';
import { IConfusionPairStat, ExerciseSlug } from '@brain-exercises/shared';
import { Flame, Info, CheckCircle2, TrendingUp, TrendingDown, Minus, Play } from 'lucide-react';

interface ConfusionMatrixChartProps {
  confusionStats: IConfusionPairStat[];
  selectedSlug?: ExerciseSlug | 'ALL';
  onSelectPair?: (pairKey: string) => void;
  className?: string;
}

export const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({
  confusionStats,
  selectedSlug = 'ALL',
  onSelectPair,
  className = ''
}) => {
  const [hoveredPair, setHoveredPair] = useState<IConfusionPairStat | null>(null);

  // Filter stats if slug selected
  const filteredStats = useMemo(() => {
    if (selectedSlug && selectedSlug !== 'ALL') {
      return confusionStats.filter(s => s.exerciseSlug === selectedSlug);
    }
    return confusionStats;
  }, [confusionStats, selectedSlug]);

  // Extract distinct items for matrix axes
  const { labels, matrix, maxErrors } = useMemo(() => {
    const itemSet = new Set<string>();
    filteredStats.forEach(s => {
      itemSet.add(s.codeA);
      itemSet.add(s.codeB);
    });

    const labelsList = Array.from(itemSet).slice(0, 10); // Max 10x10 for optimal readability
    const map = new Map<string, IConfusionPairStat>();
    let max = 1;

    filteredStats.forEach(s => {
      map.set(`${s.codeA}:${s.codeB}`, s);
      map.set(`${s.codeB}:${s.codeA}`, s);
      if (s.totalErrors > max) max = s.totalErrors;
    });

    return {
      labels: labelsList,
      matrix: map,
      maxErrors: max
    };
  }, [filteredStats]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-400/40 border-slate-200/40 dark:border-slate-800/40';
    const intensity = Math.min(1, count / maxErrors);

    if (intensity < 0.3) {
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold';
    }
    if (intensity < 0.7) {
      return 'bg-orange-500/30 text-orange-700 dark:text-orange-200 border-orange-500/40 font-bold';
    }
    return 'bg-rose-500/45 text-white border-rose-500/60 font-black shadow-inner shadow-rose-900/40';
  };

  if (filteredStats.length === 0) {
    return (
      <div className={`p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Chưa ghi nhận điểm nhầm lẫn đáng kể!
        </h4>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Khi bạn hoàn thành các bài tập thính giác và gặp các câu trả lời sai, hệ thống sẽ tự động lập ma trận nhiệt để phát hiện các cặp âm thanh bạn hay nhầm lẫn nhất.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ma Trận Nhầm Lẫn (Confusion Heatmap)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Màu càng đỏ đậm thể hiện cặp âm thanh bạn thường xuyên nhầm lẫn nhất
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Ít</span>
          <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
          <div className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/50" />
          <div className="w-3 h-3 rounded bg-rose-500/60 border border-rose-500/70" />
          <span>Nhiều</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="p-2 text-xs font-mono text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  A \ B
                </th>
                {labels.map(l => (
                  <th
                    key={l}
                    className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono text-center min-w-[42px] border-b border-slate-200 dark:border-slate-800"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map(rowLabel => (
                <tr key={rowLabel}>
                  <td className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono text-right pr-3 border-r border-slate-200 dark:border-slate-800">
                    {rowLabel}
                  </td>
                  {labels.map(colLabel => {
                    const isDiagonal = rowLabel === colLabel;
                    const stat = matrix.get(`${rowLabel}:${colLabel}`);
                    const count = stat ? stat.totalErrors : 0;

                    if (isDiagonal) {
                      return (
                        <td
                          key={colLabel}
                          className="p-1 text-center bg-slate-100/40 dark:bg-slate-800/20 border border-slate-200/30 dark:border-slate-800/30 text-slate-300 dark:text-slate-700 text-xs font-mono"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td key={colLabel} className="p-1 text-center">
                        <button
                          onClick={() => stat && onSelectPair?.(stat.pairKey)}
                          onMouseEnter={() => stat && setHoveredPair(stat)}
                          onMouseLeave={() => setHoveredPair(null)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center text-xs transition-all active:scale-95 ${getHeatmapColor(
                            count
                          )} ${stat ? 'hover:scale-110 cursor-pointer shadow-sm' : 'cursor-default'}`}
                        >
                          {count > 0 ? count : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hovered / Active Tooltip Info Card */}
      {hoveredPair && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-300">
                {hoveredPair.labelA} ↔ {hoveredPair.labelB}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {hoveredPair.pairKey}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Đã nhầm <strong className="text-rose-400">{hoveredPair.totalErrors} lần</strong> (Gần đây: {hoveredPair.recentErrors} lần) • Phản xạ TB: {hoveredPair.avgResponseMs}ms
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {hoveredPair.trendDirection === 'improving' && (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> Đang cải thiện
                </span>
              )}
              {hoveredPair.trendDirection === 'declining' && (
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> Hay tái phạm
                </span>
              )}
              {hoveredPair.trendDirection === 'stagnant' && (
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Minus className="w-3.5 h-3.5" /> Cần luyện thêm
                </span>
              )}
            </div>

            {onSelectPair && (
              <button
                onClick={() => onSelectPair(hoveredPair.pairKey)}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Play className="w-3 h-3" />
                <span>Ôn tập</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
