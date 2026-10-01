import React, { useState } from 'react';
import { IAuditoryProgressSnapshot } from '@brain-exercises/shared';
import { TrendingUp, Activity, Calendar, Zap, Award } from 'lucide-react';

interface AuditoryProgressTimelineProps {
  snapshots: IAuditoryProgressSnapshot[];
  className?: string;
}

export const AuditoryProgressTimeline: React.FC<AuditoryProgressTimelineProps> = ({
  snapshots,
  className = ''
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<IAuditoryProgressSnapshot | null>(null);

  // SVG Chart dimensions
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const validSnapshots = snapshots.slice(-14); // 14 days
  const pointCount = validSnapshots.length;

  const points = validSnapshots.map((s, idx) => {
    const x = paddingX + (idx / Math.max(1, pointCount - 1)) * (width - paddingX * 2);
    // Y mapped from 0% (bottom) to 100% (top)
    const y = height - paddingY - (s.accuracyRate / 100) * (height - paddingY * 2);
    return { x, y, data: s };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient area closed polygon
  const areaPolygonStr = points.length > 0
    ? `${points[0].x},${height - paddingY} ${polylineStr} ${points[points.length - 1].x},${height - paddingY}`
    : '';

  // Calculate aggregated metrics
  const avgAccuracy = validSnapshots.length > 0
    ? Math.round(validSnapshots.reduce((acc, c) => acc + c.accuracyRate, 0) / validSnapshots.length)
    : 100;

  const totalWrong = validSnapshots.reduce((acc, c) => acc + c.wrongCount, 0);

  return (
    <div className={`p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tiến Bộ Thính Giác Theo Thời Gian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Độ chính xác cảm âm và số lỗi ghi nhận trong 14 ngày qua
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Độ chính xác TB</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{avgAccuracy}%</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">Tổng câu sai</span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-300">{totalWrong}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="progressAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="progressLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="4 4"
          />
          <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            100%
          </text>

          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="4 4"
          />
          <text x={paddingX - 10} y={height / 2 + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            50%
          </text>

          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
          />
          <text x={paddingX - 10} y={height - paddingY + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            0%
          </text>

          {/* Area fill */}
          {areaPolygonStr && <polygon points={areaPolygonStr} fill="url(#progressAreaGrad)" />}

          {/* Line stroke */}
          {polylineStr && (
            <polyline
              points={polylineStr}
              fill="none"
              stroke="url(#progressLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.date === p.data.date ? 6 : 4}
                className="fill-cyan-500 stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(p.data)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Date label at every 3 points */}
              {idx % 3 === 0 && (
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-slate-400"
                >
                  {p.data.date.slice(5)}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 p-2.5 rounded-xl bg-slate-900/90 text-white border border-slate-700 backdrop-blur-md shadow-xl text-xs z-10 animate-fadeIn">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ngày {hoveredPoint.date}</span>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-slate-300">
              <div>Độ chính xác: <strong className="text-emerald-400">{hoveredPoint.accuracyRate}%</strong></div>
              <div>Số câu làm sai: <strong className="text-rose-400">{hoveredPoint.wrongCount} câu</strong></div>
              {hoveredPoint.avgResponseMs > 0 && (
                <div>Phản xạ TB: <strong>{hoveredPoint.avgResponseMs}ms</strong></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
