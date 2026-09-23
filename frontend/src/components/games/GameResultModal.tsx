import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Clock, ArrowRight, RotateCcw, Brain } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

import { IRawMetricsJson } from '@brain-exercises/shared';

interface GameResultProps {
  score: number;
  accuracyRate: number;
  timeSpentSec: number;
  effectiveWpm?: number;
  rawMetricsJson?: IRawMetricsJson;
  onRestart: () => void;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultProps> = ({
  score,
  accuracyRate,
  timeSpentSec,
  effectiveWpm,
  rawMetricsJson,
  onRestart,
  onClose
}) => {
  const { 
    activeWorkoutRoutine, 
    nextWorkoutStep, 
    getExerciseLevel,
    autoDifficulty,
    recordAttempt,
    activeGameSlug,
    activeSynergy,
    playSound,
    setActiveDebriefEvents,
    setSelectedExerciseSlug,
    setActiveGameSlug,
    authUser,
    setIsAuthModalOpen
  } = useAppStore();

  const currentLevel = activeGameSlug ? getExerciseLevel(activeGameSlug) : 1;

  useEffect(() => {
    playSound('victory');
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    if (activeGameSlug) {
      recordAttempt({
        id: `att-${Date.now()}`,
        exerciseSlug: activeGameSlug,
        score,
        accuracyRate,
        timeSpentSec,
        effectiveWpm,
        xpEarned: Math.round(score / 10) + 20,
        level: currentLevel,
        rawMetricsJson
      });
    }
  }, []);

  const handleNext = () => {
    playSound('click');
    if (activeWorkoutRoutine) {
      nextWorkoutStep();
    } else {
      if (activeGameSlug) {
        const slug = activeGameSlug;
        setActiveGameSlug(null);
        setSelectedExerciseSlug(slug);
      } else {
        onClose();
      }
    }
  };

  const handleBackToList = () => {
    playSound('click');
    const slug = activeGameSlug;
    setActiveGameSlug(null);
    setSelectedExerciseSlug(null);
    setTimeout(() => {
      if (slug) {
        const el = document.getElementById(`exercise-card-${slug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-5 animate-scale-up">
        {/* Trophy Header */}
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center shadow-inner">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {activeWorkoutRoutine ? 'Hoàn thành chặng tập!' : 'Kết Quả Luyện Tập'}
          </span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            +{score} Điểm
          </h3>
          <p className="text-xs text-slate-500 mt-1">Cấp độ {currentLevel} {autoDifficulty && '(Tự động thích ứng)'}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Chính xác</span>
            </div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{accuracyRate}%</p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Thời gian</span>
            </div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{timeSpentSec}s</p>
          </div>
        </div>

        {activeSynergy && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-400/40 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                Combo Cộng Hưởng Não Bộ!
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                +{activeSynergy.bonusXpPercent}% XP
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              {activeSynergy.title}: {activeSynergy.description}
            </p>
          </div>
        )}

        {effectiveWpm ? (
          <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900">
            <span className="text-xs text-brand-700 dark:text-brand-300 font-semibold">Tốc độ đọc hiệu dụng</span>
            <p className="text-xl font-black text-brand-600 dark:text-brand-400 mt-0.5">{effectiveWpm} WPM</p>
          </div>
        ) : null}

        {!authUser && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Lưu kỷ lục vĩnh viễn</p>
                <p className="text-[11px] text-slate-500">Đăng nhập Google để đồng bộ mây</p>
              </div>
            </div>
            <button
              onClick={() => {
                playSound('click');
                setIsAuthModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl shadow-sm transition-all flex-shrink-0"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {rawMetricsJson?.relationEvents && rawMetricsJson.relationEvents.length > 0 && (
            <button
              onClick={() => {
                playSound('click');
                setActiveDebriefEvents(rawMetricsJson.relationEvents);
              }}
              className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Xem Phân Tích Quan Hệ Não Bộ ({rawMetricsJson.relationEvents.length} dữ kiện)</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
          >
            <span>{activeWorkoutRoutine ? 'Bài tiếp theo trong gói' : 'Về trang cấp độ & cài đặt'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                playSound('click');
                onRestart();
              }}
              className="py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Luyện lại cấp này
            </button>

            <button
              onClick={handleBackToList}
              className="py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Về danh sách</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
