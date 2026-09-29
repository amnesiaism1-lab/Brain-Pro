import React, { useState } from 'react';
import { 
  BookOpen, 
  Bell, 
  Clock, 
  Star, 
  Play, 
  Flame, 
  Trophy, 
  Network, 
  Sparkles, 
  ArrowRight,
  Zap,
  Eye,
  Target,
  Brain,
  Music,
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { 
  WORKOUT_ROUTINES, 
  IWorkoutRoutine, 
  EXERCISES_METADATA, 
  EXERCISE_SYNERGIES, 
  CognitiveCategoryCode 
} from '@brain-exercises/shared';

export const HomeView: React.FC = () => {
  const { 
    setIsHowToTrainOpen, 
    setIsRemindersOpen, 
    startWorkoutRoutine, 
    streak, 
    xp, 
    level,
    lastPlayedSlug,
    getExerciseLevel,
    setExerciseLevel,
    setActiveGameSlug,
    setActiveTab,
    setSelectedExercisesCategory,
    weeklyChallenges,
    playSound 
  } = useAppStore();

  const [activeSynergyIndex, setActiveSynergyIndex] = useState(0);

  const handleStartWorkout = (routine: IWorkoutRoutine) => {
    playSound('click');
    startWorkoutRoutine(routine);
  };

  const handleExploreCategory = (catCode: CognitiveCategoryCode) => {
    playSound('click');
    setSelectedExercisesCategory(catCode);
    setActiveTab('exercises');
  };

  // Find last played exercise or default
  const lastExercise = lastPlayedSlug 
    ? EXERCISES_METADATA.find(e => e.slug === lastPlayedSlug) 
    : EXERCISES_METADATA.find(e => e.slug === 'schulte-table');
  const lastExerciseLevel = lastExercise ? getExerciseLevel(lastExercise.slug) : 1;

  // 6 Cognitive Pillars configuration
  const cognitivePillars = [
    {
      code: 'SPEED_READING' as CognitiveCategoryCode,
      name: 'Đọc Nhanh',
      sub: 'Mở rộng WPM & Bỏ đọc thầm',
      count: 4,
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
      border: 'border-amber-400/30 hover:border-amber-400',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      code: 'PERIPHERAL_VISION' as CognitiveCategoryCode,
      name: 'Thị Giác Ngoại Vi',
      sub: 'Tăng góc nhìn & Quét từ khóa',
      count: 4,
      icon: <Eye className="w-5 h-5 text-cyan-500" />,
      gradient: 'from-cyan-500/15 via-blue-500/10 to-transparent',
      border: 'border-cyan-400/30 hover:border-cyan-400',
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
    },
    {
      code: 'ATTENTION' as CognitiveCategoryCode,
      name: 'Tập Trung & Chú Ý',
      sub: 'Lọc nhiễu & Duy trì bền bỉ',
      count: 6,
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
      border: 'border-emerald-400/30 hover:border-emerald-400',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
    },
    {
      code: 'MEMORY' as CognitiveCategoryCode,
      name: 'Trí Nhớ Làm Việc',
      sub: 'Dung lượng nhớ & Đồ thị không gian',
      count: 5,
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      gradient: 'from-purple-500/15 via-indigo-500/10 to-transparent',
      border: 'border-purple-400/30 hover:border-purple-400',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
    },
    {
      code: 'REACTION' as CognitiveCategoryCode,
      name: 'Phản Xạ & Ức Chế',
      sub: 'Xung đột nhận thức & Ra quyết định',
      count: 4,
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      gradient: 'from-rose-500/15 via-red-500/10 to-transparent',
      border: 'border-rose-400/30 hover:border-rose-400',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
    },
    {
      code: 'AUDITORY_MEMORY' as CognitiveCategoryCode,
      name: 'Cảm Âm & Thính Giác',
      sub: 'Cao độ, Quãng, Nhịp & Giọng hát',
      count: 8,
      icon: <Music className="w-5 h-5 text-indigo-500" />,
      gradient: 'from-indigo-500/15 via-purple-500/10 to-transparent',
      border: 'border-indigo-400/30 hover:border-indigo-400',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
    }
  ];

  // Synergies
  const currentSynergy = EXERCISE_SYNERGIES[activeSynergyIndex] || EXERCISE_SYNERGIES[0];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in pb-28">
      {/* Welcome & Streak Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-600/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-200">Chào mừng trở lại!</span>
            <h2 className="text-2xl sm:text-3xl font-black">Sẵn Sàng Rèn Luyện Não Bộ?</h2>
            <p className="text-xs sm:text-sm text-brand-100">
              Cấp độ nhận thức: <strong className="text-white font-black">Cấp {level}</strong> ({xp} XP tích lũy) • Đã cập nhật 31 bài tập & 12 quan hệ
            </p>
          </div>
          <div className="flex sm:flex-col items-center justify-between sm:justify-center bg-white/15 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-white/20 shadow-lg shrink-0">
            <div className="flex items-center gap-2 sm:flex-col sm:gap-0">
              <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-amber-300 fill-amber-300 animate-bounce" />
              <span className="text-base sm:text-xl font-black mt-0.5 sm:mt-1">{streak} ngày</span>
            </div>
            <span className="text-[11px] sm:text-xs text-brand-100 font-semibold">Chuỗi ngày</span>
          </div>
        </div>
      </div>

      {/* Smart Resume / Quick Training Hub */}
      {lastExercise && (
        <div className="bg-[#F5EFE6] dark:bg-slate-800/90 border-2 border-brand-500/40 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-600/30 shrink-0">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {lastPlayedSlug ? 'Tiếp tục bài tập gần nhất' : 'Khởi động não bộ hôm nay'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                {lastExercise.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấp độ hiện tại: <strong className="text-brand-600 dark:text-brand-400 font-bold">Cấp {lastExerciseLevel}</strong> • {lastExercise.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setActiveGameSlug(lastExercise.slug);
            }}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all btn-press shrink-0"
          >
            <span>{lastPlayedSlug ? 'Chơi tiếp ngay' : 'Bắt đầu luyện tập'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Featured Flagship: Mạng Lưới Quan Hệ Động Học */}
      <div 
        onClick={() => {
          playSound('click');
          setActiveGameSlug('relational-network');
        }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-500/40 p-6 sm:p-7 shadow-2xl shadow-cyan-500/10 cursor-pointer group hover:border-cyan-400 transition-all duration-300"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-cyan-500/20 transition-all" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0 group-hover:scale-105 transition-transform">
              <Network className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Đột Phá Mới • Relational Dynamics
                </span>
                <span className="text-[10px] font-bold text-slate-400">12 Cấp + 10 Cấp Vô Tận</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-200 transition-colors">
                Mạng Lưới Quan Hệ Động Học
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Rèn luyện khả năng mô phỏng trong tâm trí, phẫu thuật xúc tu, chiếm lĩnh đòn bẩy nút lõi và dự đoán phản ứng dây chuyền nơ-ron.
              </p>
            </div>
          </div>
          <button className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 shrink-0 group-hover:translate-x-1 transition-all">
            <span>Trải nghiệm ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Khối Năng Lực Nhận Thức (6 Cognitive Pillars Hub) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              6 Trục Năng Lực Não Bộ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Khám phá toàn bộ 31 bài tập được phân loại theo cấu trúc khoa học thần kinh
            </p>
          </div>
          <button
            onClick={() => {
              playSound('click');
              setSelectedExercisesCategory('ALL');
              setActiveTab('exercises');
            }}
            className="text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả (31)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {cognitivePillars.map((pillar) => (
            <div
              key={pillar.code}
              onClick={() => handleExploreCategory(pillar.code)}
              className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${pillar.gradient} bg-[#F5EFE6] dark:bg-slate-800/80 border ${pillar.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer btn-press flex flex-col justify-between gap-3 group`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-700/80 shadow-sm">
                  {pillar.icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pillar.badgeColor}`}>
                  {pillar.count} bài tập
                </span>
              </div>

              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {pillar.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                  {pillar.sub}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>Khám phá</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Luyện tập (Workouts Section) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Lộ Trình Luyện Tập Hàng Ngày
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Chuỗi bài tập tự động luân phiên theo quỹ thời gian của bạn</p>
          </div>
          <span className="text-xs sm:text-sm text-brand-600 dark:text-brand-400 font-bold">4 chế độ</span>
        </div>

        {/* Responsive Grid of 4 Workouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {WORKOUT_ROUTINES.map((routine) => (
            <div
              key={routine.id}
              onClick={() => handleStartWorkout(routine)}
              className="bg-[#F5EFE6] dark:bg-slate-800/90 border border-[#D5CBB9] dark:border-slate-700/80 rounded-3xl p-5 flex flex-col items-center justify-between shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-200 cursor-pointer btn-press group"
            >
              {/* Clock Illustration */}
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-700 border-2 border-brand-500/80 flex items-center justify-center relative shadow-inner my-1">
                <Clock className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 my-1.5 text-brand-600 dark:text-brand-400">
                {Array.from({ length: routine.starRating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>

              {/* Title & Duration */}
              <div className="text-center w-full">
                <h3 className="font-black text-base text-slate-800 dark:text-white leading-tight">
                  {routine.title}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {routine.durationMinutes} phút • {routine.items.length} bài tập
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-medium">
                  {routine.items.map(item => item.exerciseTitle).join(' • ')}
                </p>
              </div>

              <div className="mt-3.5 w-full py-2 bg-brand-600/10 group-hover:bg-brand-600 group-hover:text-white text-brand-700 dark:text-brand-300 rounded-xl text-center text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                <Play className="w-3.5 h-3.5 fill-current" />
                Bắt đầu lộ trình
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Section: Challenges & Synergies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Weekly Challenges (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Thử Thách Tuần Này
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-brand-600 dark:text-brand-400 font-bold">Làm mới sau 4 ngày</span>
          </div>

          <div className="space-y-3">
            {weeklyChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  playSound('click');
                  setExerciseLevel(ch.exerciseSlug, ch.targetLevel);
                  setActiveGameSlug(ch.exerciseSlug);
                }}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm hover:shadow-md btn-press ${
                  ch.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-[#F5EFE6] dark:bg-slate-800/90 border-[#D5CBB9] dark:border-slate-700 hover:border-brand-500'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-black text-base text-slate-800 dark:text-white">
                      {ch.title}
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                      Cấp {ch.targetLevel}+
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    +{ch.xpReward} XP
                  </span>
                  {ch.isCompleted ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-xl">
                      ✓ Hoàn thành
                    </span>
                  ) : (
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/40 px-3 py-1 rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      Thử thách →
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Synergy Combos & Quick Actions (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Synergy Combos Hub */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-brand-500/10 to-purple-500/10 border-2 border-indigo-300 dark:border-indigo-800/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h4 className="text-base font-black text-slate-800 dark:text-white">Cộng Hưởng Kỹ Năng</h4>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-md">
                {currentSynergy.bonusXpPercent}% XP Combo
              </span>
            </div>

            {/* Synergy Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {EXERCISE_SYNERGIES.map((syn, idx) => (
                <button
                  key={syn.id}
                  onClick={() => setActiveSynergyIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeSynergyIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white'
                  }`}
                >
                  Combo {idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <h5 className="font-black text-sm text-indigo-700 dark:text-indigo-300">
                {currentSynergy.title}
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentSynergy.description}
              </p>
            </div>

            <button
              onClick={() => {
                playSound('click');
                setActiveGameSlug(currentSynergy.exerciseASlug);
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 btn-press"
            >
              <span>Khởi động Chuỗi Combo Ngay</span>
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                playSound('click');
                setIsHowToTrainOpen(true);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-base shadow-lg shadow-brand-600/25 flex items-center justify-center gap-3 transition-all duration-150 btn-press"
            >
              <div className="p-1 rounded-full bg-white/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span>Luyện tập như thế nào? (Phương pháp)</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setIsRemindersOpen(true);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 border-2 border-[#D5CBB9] dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-white font-bold text-base shadow-sm flex items-center justify-center gap-3 transition-all duration-150 btn-press"
            >
              <div className="p-1 rounded-full bg-brand-100 dark:bg-slate-700 text-brand-600">
                <Bell className="w-5 h-5" />
              </div>
              <span>Cài đặt nhắc nhở rèn luyện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
