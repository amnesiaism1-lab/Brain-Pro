import React from 'react';
import { ChevronLeft, HelpCircle, Flame, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EXERCISES_METADATA } from '@brain-exercises/shared';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    activeGameSlug, 
    setActiveGameSlug,
    selectedExerciseSlug, 
    setSelectedExerciseSlug, 
    setIsHowToTrainOpen,
    streak, 
    xp,
    authUser,
    setIsAuthModalOpen,
    playSound 
  } = useAppStore();

  const getTitle = () => {
    if (activeGameSlug) {
      const ex = EXERCISES_METADATA.find(e => e.slug === activeGameSlug);
      return ex ? ex.title : 'Luyện tập';
    }
    if (selectedExerciseSlug) {
      const ex = EXERCISES_METADATA.find(e => e.slug === selectedExerciseSlug);
      return ex ? ex.title : 'Chi tiết bài tập';
    }
    switch (activeTab) {
      case 'home':
        return 'Trang chủ';
      case 'exercises':
        return 'Bài tập';
      case 'settings':
        return 'Cài đặt';
      case 'user':
        return 'Hồ sơ cá nhân';
      default:
        return 'Brain Exercises';
    }
  };

  const handleBack = () => {
    playSound('click');
    if (activeGameSlug) {
      // Quay lại từ trong bài tập về trang cấp độ (ExerciseDetailModal)
      const currentSlug = activeGameSlug;
      setActiveGameSlug(null);
      setSelectedExerciseSlug(currentSlug);
    } else if (selectedExerciseSlug) {
      // Quay lại từ trang cấp độ về danh sách bài tập, cuộn mượt về đúng thẻ vừa chọn
      const lastSlug = selectedExerciseSlug;
      setSelectedExerciseSlug(null);
      setTimeout(() => {
        const el = document.getElementById(`exercise-card-${lastSlug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
  };

  const isDetailPage = Boolean(activeGameSlug || selectedExerciseSlug);

  return (
    <header className="sticky top-0 z-30 bg-brand-600 dark:bg-brand-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Back button or brand badge */}
        <div className="flex items-center gap-2">
          {isDetailPage ? (
            <button
              onClick={handleBack}
              aria-label="Quay lại"
              className="p-1.5 -ml-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs sm:text-sm font-semibold shadow-inner">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300" />
              <span>{streak} ngày</span>
            </div>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white drop-shadow-sm truncate max-w-xs sm:max-w-md md:max-w-lg text-center">
          {getTitle()}
        </h1>

        {/* Right: Help button (?) or XP badge + Auth Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isDetailPage ? (
            <button
              onClick={() => {
                playSound('click');
                setIsHowToTrainOpen(true);
              }}
              aria-label="Hướng dẫn bài tập"
              className="p-1.5 -mr-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          ) : (
            <>
              <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs sm:text-sm font-bold shadow-inner">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{xp} XP</span>
              </div>

              {authUser ? (
                <button
                  onClick={() => {
                    playSound('click');
                    setActiveTab('user');
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-all text-xs font-bold border border-white/20 shadow-inner group"
                  title="Xem hồ sơ nhận thức"
                >
                  {authUser.avatarUrl ? (
                    <img 
                      src={authUser.avatarUrl} 
                      alt={authUser.username}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-white/60" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black">
                      {authUser.username[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline truncate max-w-[90px]">{authUser.username}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    L{authUser.currentLevel}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    playSound('click');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-black/10 transition-all active:scale-95 btn-press"
                  title="Đăng nhập Google để lưu dữ liệu đám mây"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="hidden xs:inline">Đăng nhập</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
