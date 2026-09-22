import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Flame, Zap, Trophy, ShieldCheck, Activity, Sparkles } from 'lucide-react';
import { EXERCISE_VARIANTS, EXERCISES_METADATA } from '@brain-exercises/shared';

export const ProfileView: React.FC = () => {
  const { xp, level, streak, cognitiveSnapshots, exerciseMasteries, getExerciseLevel } = useAppStore();

  // Radar scores: current week vs last week snapshot
  const currentSnapshot = cognitiveSnapshots[cognitiveSnapshots.length - 1] || {
    speedReadingScore: 84,
    peripheralVisionScore: 88,
    memoryScore: 79,
    attentionScore: 90,
    reactionScore: 85
  };

  const prevSnapshot = cognitiveSnapshots[cognitiveSnapshots.length - 2] || {
    speedReadingScore: 72,
    peripheralVisionScore: 75,
    memoryScore: 68,
    attentionScore: 80,
    reactionScore: 74
  };

  // Convert radar 0-100 values to SVG polygon coordinates
  const centerX = 130;
  const centerY = 130;
  const radius = 85;

  const points = [
    { label: 'Đọc nhanh', val: currentSnapshot.speedReadingScore, prevVal: prevSnapshot.speedReadingScore, angle: -Math.PI / 2 },
    { label: 'Thị giác', val: currentSnapshot.peripheralVisionScore, prevVal: prevSnapshot.peripheralVisionScore, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: 'Tập trung', val: currentSnapshot.attentionScore, prevVal: prevSnapshot.attentionScore, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: 'Trí nhớ', val: currentSnapshot.memoryScore, prevVal: prevSnapshot.memoryScore, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: 'Phản xạ', val: currentSnapshot.reactionScore, prevVal: prevSnapshot.reactionScore, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  const currentPolygon = points
    .map(p => {
      const r = (p.val / 100) * radius;
      const x = centerX + r * Math.cos(p.angle);
      const y = centerY + r * Math.sin(p.angle);
      return `${x},${y}`;
    })
    .join(' ');

  const prevPolygon = points
    .map(p => {
      const r = (p.prevVal / 100) * radius;
      const x = centerX + r * Math.cos(p.angle);
      const y = centerY + r * Math.sin(p.angle);
      return `${x},${y}`;
    })
    .join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1];

  // Count stage 3 masteries (level >= 9)
  const unlockedVariantsCount = Object.values(exerciseMasteries).filter(m => m.highestLevelReached >= 9).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in pb-28">
      {/* Profile Header Card */}
      <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-brand-600/30 shrink-0">
          U
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">Brain Master</h2>
            <span className="px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-black">
              Cấp {level}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Thành viên luyện não đỉnh cao &bull; 12 Cấp độ tiến trình</p>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-500">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> {streak} ngày liên tiếp
            </span>
            <span>&bull;</span>
            <span className="text-brand-600 dark:text-brand-400 font-black">{xp} XP tích lũy</span>
          </div>
        </div>
      </div>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (lg:col-span-6): Radar Chart & Badges */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cognitive Radar Analysis Chart */}
          <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Biểu Đồ Radar Não Bộ Tiến Triển</h3>
                <p className="text-xs sm:text-sm text-slate-500">So sánh năng lực: Tuần này (Xanh) vs Tuần trước (Cam)</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-brand-600 inline-block shadow-sm" />
                <span className="text-slate-700 dark:text-slate-300">Tuần này</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-dashed border-amber-600 inline-block shadow-sm" />
                <span className="text-slate-700 dark:text-slate-300">Tuần trước</span>
              </div>
            </div>

            {/* SVG Spider Radar */}
            <div className="flex flex-col items-center justify-center py-2">
              <svg width="280" height="280" className="overflow-visible">
                {/* Background spider webs */}
                {gridCircles.map((frac, idx) => {
                  const r = frac * radius;
                  const pts = points
                    .map(p => `${centerX + r * Math.cos(p.angle)},${centerY + r * Math.sin(p.angle)}`)
                    .join(' ');
                  return (
                    <polygon
                      key={idx}
                      points={pts}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      strokeDasharray={frac < 1 ? '3 3' : 'none'}
                    />
                  );
                })}

                {/* Previous Week Polygon (Amber dashed) */}
                <polygon
                  points={prevPolygon}
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Current Week Polygon (Royal Blue solid) */}
                <polygon
                  points={currentPolygon}
                  fill="rgba(37, 99, 235, 0.35)"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                />

                {/* Vertices & Labels */}
                {points.map((p, idx) => {
                  const r = (p.val / 100) * radius;
                  const x = centerX + r * Math.cos(p.angle);
                  const y = centerY + r * Math.sin(p.angle);

                  const labelR = radius + 24;
                  const lx = centerX + labelR * Math.cos(p.angle);
                  const ly = centerY + labelR * Math.sin(p.angle);

                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300"
                      >
                        {p.label} ({p.val})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Huy Hiệu Đạt Được</h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex flex-col items-center">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 mb-2" />
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">Đại Bàng</span>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Gorbov Đỏ-Đen</span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex flex-col items-center">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-brand-500 mb-2" />
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">Thần Tốc</span>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5">RSVP 1200 WPM</span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 mb-2" />
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">Bền Bỉ</span>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Streak 5 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Stage III Variants Unlocked Gallery */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Biến Thể Đỉnh Cao (Stage III - Cấp 9-12)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">Mở khóa khi đạt cấp độ 9 của từng bài tập</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                {unlockedVariantsCount} / {EXERCISES_METADATA.length} Đã mở
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {EXERCISE_VARIANTS.map((v) => {
                const currentExLevel = getExerciseLevel(v.exerciseSlug as any);
                const isUnlocked = currentExLevel >= v.minLevel;

                return (
                  <div
                    key={v.variantCode}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-purple-500/10 border-purple-500/40 text-slate-800 dark:text-white shadow-sm'
                        : 'bg-white/40 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold truncate">{v.variantName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-bold">
                          {v.variantCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">{v.variantDescription}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      isUnlocked ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {isUnlocked ? 'Sẵn sàng' : `Cấp ${v.minLevel}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
