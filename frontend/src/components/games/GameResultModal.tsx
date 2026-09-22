import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface GameResultProps {
  score: number;
  accuracyRate: number;
  timeSpentSec: number;
  effectiveWpm?: number;
  onRestart: () => void;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultProps> = ({
  score,
  accuracyRate,
  timeSpentSec,
  effectiveWpm,
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
    playSound 
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
        currentLevel,
        totalXp: 0,
        currentStreak: 4,
        recommendedNextLevel: accuracyRate >= 90 ? Math.min(12, currentLevel + 1) : currentLevel,
        isNewHighScore: true,
        message: 'Hoàn thành bài tập xuất sắc!'
      } as any);
    }
  }, []);

  const handleNext = () => {
    playSound('click');
    if (activeWorkoutRoutine) {
      nextWorkoutStep();
    } else {
      onClose();
    }
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

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
          >
            <span>{activeWorkoutRoutine ? 'Bài tiếp theo trong gói' : 'Hoàn tất'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              playSound('click');
              onRestart();
            }}
            className="w-full py-2.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Luyện tập lại cấp này
          </button>
        </div>
      </div>
    </div>
  );
};
