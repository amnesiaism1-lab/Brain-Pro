import React from 'react';
import { ChevronLeft, HelpCircle, Flame, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EXERCISES_METADATA } from '@brain-exercises/shared';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    activeGameSlug, 
    setActiveGameSlug,
    selectedExerciseSlug, 
    setSelectedExerciseSlug, 
    setIsHowToTrainOpen,
    streak, 
    xp,
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
      setActiveGameSlug(null);
    } else if (selectedExerciseSlug) {
      setSelectedExerciseSlug(null);
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

        {/* Right: Help button (?) or XP badge */}
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs sm:text-sm font-bold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{xp} XP</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
