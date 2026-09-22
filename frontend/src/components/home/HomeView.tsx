import React from 'react';
import { BookOpen, Bell, Clock, Star, Play, Flame, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { WORKOUT_ROUTINES, IWorkoutRoutine } from '@brain-exercises/shared';

export const HomeView: React.FC = () => {
  const { 
    setIsHowToTrainOpen, 
    setIsRemindersOpen, 
    startWorkoutRoutine, 
    streak, 
    xp, 
    level,
    playSound 
  } = useAppStore();

  const handleStartWorkout = (routine: IWorkoutRoutine) => {
    playSound('click');
    startWorkoutRoutine(routine);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in pb-28">
      {/* Welcome & Streak Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-600/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-200">Chào mừng trở lại!</span>
            <h2 className="text-2xl sm:text-3xl font-black">Sẵn Sàng Rèn Luyện Não Bộ?</h2>
            <p className="text-xs sm:text-sm text-brand-100">Cấp độ nhận thức: <strong className="text-white font-black">Cấp {level}</strong> ({xp} XP tích lũy)</p>
          </div>
          <div className="flex flex-col items-center bg-white/15 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-white/20 shadow-lg">
            <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-amber-300 fill-amber-300 animate-bounce" />
            <span className="text-base sm:text-xl font-black mt-1">{streak} ngày</span>
            <span className="text-[11px] sm:text-xs text-brand-100 font-semibold">Chuỗi ngày</span>
          </div>
        </div>
      </div>

      {/* Luyện tập (Workouts Section) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Lộ Trình Luyện Tập Hàng Ngày
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Chọn bài tập theo thời gian sẵn có của bạn</p>
          </div>
          <span className="text-xs sm:text-sm text-brand-600 dark:text-brand-400 font-bold">4 chế độ</span>
        </div>

        {/* Responsive Grid of 4 Workouts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {WORKOUT_ROUTINES.map((routine) => (
            <div
              key={routine.id}
              onClick={() => handleStartWorkout(routine)}
              className="bg-[#F5EFE6] dark:bg-slate-800/90 border border-[#D5CBB9] dark:border-slate-700/80 rounded-3xl p-5 flex flex-col items-center justify-between shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-200 cursor-pointer btn-press group"
            >
              {/* Clock Illustration */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-slate-700 border-2 border-brand-500/80 flex items-center justify-center relative shadow-inner my-2">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-brand-600 dark:text-brand-400" />
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-brand-500 animate-ping" />
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 my-2 text-brand-600 dark:text-brand-400">
                {Array.from({ length: routine.starRating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>

              {/* Title & Duration */}
              <div className="text-center">
                <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-white leading-tight">
                  {routine.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold mt-1">
                  {routine.durationMinutes} phút
                </p>
              </div>

              <div className="mt-4 w-full py-2 bg-brand-600/10 group-hover:bg-brand-600 group-hover:text-white text-brand-700 dark:text-brand-300 rounded-xl text-center text-xs sm:text-sm font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                <Play className="w-3.5 h-3.5 fill-current" />
                Bắt đầu
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive 2-Column Section on Desktop & iPad */}
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
            {useAppStore.getState().weeklyChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  playSound('click');
                  useAppStore.getState().setActiveGameSlug(ch.exerciseSlug);
                }}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                  ch.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-[#F5EFE6] dark:bg-slate-800/90 border-[#D5CBB9] dark:border-slate-700 hover:border-brand-500'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
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
          {/* Cộng Hưởng Não Bộ (Synergy Combos) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-brand-500/10 to-purple-500/10 border-2 border-indigo-300 dark:border-indigo-800/60 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h4 className="text-base font-black text-slate-800 dark:text-white">Cộng Hưởng Kỹ Năng (Synergy)</h4>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-md">
                +25% XP Combo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tập liền kề <strong>Bảng Schulte</strong> và <strong>Tầm Nhìn Ngoại Vi</strong> để kích hoạt toàn bộ vùng thị giác vỏ não (V1-V4), gia tăng gấp đôi tốc độ quét từ khóa.
            </p>
            <button
              onClick={() => {
                playSound('click');
                useAppStore.getState().setActiveGameSlug('schulte-table');
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
