import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EXERCISES_METADATA } from '@brain-exercises/shared';

export const ExerciseDetailModal: React.FC = () => {
  const { 
    selectedExerciseSlug, 
    setSelectedExerciseSlug, 
    setActiveGameSlug,
    getExerciseLevel,
    setExerciseLevel,
    autoDifficulty, 
    setAutoDifficulty,
    enableHints, 
    setEnableHints,
    attemptsHistory,
    playSound 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'stats'>('settings');

  if (!selectedExerciseSlug) return null;

  const exercise = EXERCISES_METADATA.find(e => e.slug === selectedExerciseSlug);
  if (!exercise) return null;

  const exerciseLevel = getExerciseLevel(exercise.slug);
  const currentConfig = exercise.levelConfigs.find(c => c.level === exerciseLevel) || exercise.levelConfigs[0];

  const handleStartGame = () => {
    playSound('click');
    setSelectedExerciseSlug(null);
    setActiveGameSlug(exercise.slug);
  };

  const exerciseAttempts = attemptsHistory.filter(a => a.exerciseSlug === exercise.slug);
  const bestScore = exerciseAttempts.length > 0 ? Math.max(...exerciseAttempts.map(a => a.score)) : 450;
  const avgAccuracy = exerciseAttempts.length > 0 
    ? Math.round(exerciseAttempts.reduce((s, a) => s + (a.accuracyRate || 95), 0) / exerciseAttempts.length)
    : 92;

  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const stageName = exerciseLevel >= 9 ? 'Giai đoạn III: Siêu Phàm (Biến Thể Đột Phá)' : exerciseLevel >= 5 ? 'Giai đoạn II: Bứt Phá' : 'Giai đoạn I: Khởi Động';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in pb-28">
      {/* 2 Sub-tabs: CÀI ĐẶT | THỐNG KÊ */}
      <div className="flex border-b border-[#D5CBB9] dark:border-slate-800 mb-6">
        <button
          onClick={() => {
            playSound('click');
            setActiveTab('settings');
          }}
          className={`flex-1 py-3 text-center text-sm sm:text-base font-black tracking-wider transition-all relative ${
            activeTab === 'settings'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          CÀI ĐẶT
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400" />
          )}
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('stats');
          }}
          className={`flex-1 py-3 text-center text-sm sm:text-base font-black tracking-wider transition-all relative ${
            activeTab === 'stats'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          THỐNG KÊ
          {activeTab === 'stats' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400" />
          )}
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="space-y-6">
          {/* Row 1: Tự động Độ khó toggle */}
          <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-800">
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block leading-tight">
                Tự động
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block leading-tight">
                Độ khó
              </span>
            </div>
            <button
              onClick={() => {
                playSound('click');
                setAutoDifficulty(!autoDifficulty);
              }}
              className={`w-14 h-7 rounded-full transition-colors relative ${
                autoDifficulty ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  autoDifficulty ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Row 2: Cấp độ khó heading & 12 Circular Buttons (1 to 12) */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Cấp độ khó:</h4>
              <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-full ${
                exerciseLevel >= 9
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300'
                  : exerciseLevel >= 5
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {stageName}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 no-scrollbar">
              {allLevels.map((lvl) => {
                const isSelected = exerciseLevel === lvl;
                const isStage3 = lvl >= 9;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      playSound('click');
                      setExerciseLevel(exercise.slug, lvl);
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full font-black text-sm sm:text-base flex items-center justify-center transition-all duration-150 btn-press shrink-0 ${
                      isSelected
                        ? isStage3
                          ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/50 ring-4 ring-purple-300 dark:ring-purple-900 scale-110'
                          : 'bg-brand-600 text-white shadow-xl shadow-brand-600/40 ring-4 ring-brand-300 dark:ring-brand-900 scale-110'
                        : isStage3
                          ? 'bg-purple-600/70 text-white/90 hover:bg-purple-600'
                          : 'bg-brand-600/80 text-white/90 hover:bg-brand-600 hover:scale-100'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            {/* Stage III Variant Banner if level >= 9 */}
            {currentConfig.variantName ? (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                    Biến thể: {currentConfig.variantName}
                  </span>
                  {currentConfig.variantCode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 font-bold">
                      {currentConfig.variantCode}
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            {/* Dynamic Grid / Target items text */}
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 pt-1">
              {currentConfig.gridRows && currentConfig.gridCols ? (
                <span>Bảng: {currentConfig.gridRows}x{currentConfig.gridCols} &nbsp; </span>
              ) : null}
              {currentConfig.targetItemCount ? (
                <span>Mục tiêu: {currentConfig.targetItemCount} &nbsp; </span>
              ) : null}
              {currentConfig.speedWpm ? (
                <span>Tốc độ: {currentConfig.speedWpm} WPM</span>
              ) : null}
            </div>
          </div>

          {/* Row 3: Thời gian - Exactly as in Screenshot 4 */}
          <div className="py-2.5 border-t border-b border-[#D5CBB9]/60 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-800 dark:text-white block">
              Thời gian
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {Math.round(currentConfig.timeLimitSec / 60)} ph. ({currentConfig.timeLimitSec} giây)
            </span>
          </div>

          {/* Row 4: Gợi ý toggle - Exactly as in Screenshot 4 */}
          <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-800">
            <span className="text-base font-bold text-slate-800 dark:text-white">
              Gợi ý
            </span>
            <button
              onClick={() => {
                playSound('click');
                setEnableHints(!enableHints);
              }}
              className={`w-14 h-7 rounded-full transition-colors relative ${
                enableHints ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  enableHints ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Scientific rule notes */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-[#D5CBB9]/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Cơ sở khoa học:</p>
            <p>{exercise.scientificBasis}</p>
          </div>

          {/* Big Action Button: Bắt đầu - Exactly as in Screenshot 4 */}
          <div className="pt-4">
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold text-lg shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
            >
              <Play className="w-5 h-5 fill-current" />
              Bắt đầu
            </button>
          </div>
        </div>
      ) : (
        /* Thống kê Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5EFE6] dark:bg-slate-800 p-4 rounded-2xl border border-[#D5CBB9] dark:border-slate-700">
              <span className="text-xs text-slate-500">Điểm kỷ lục</span>
              <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">{bestScore}</p>
            </div>
            <div className="bg-[#F5EFE6] dark:bg-slate-800 p-4 rounded-2xl border border-[#D5CBB9] dark:border-slate-700">
              <span className="text-xs text-slate-500">Độ chính xác</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgAccuracy}%</p>
            </div>
          </div>

          <div className="bg-[#F5EFE6] dark:bg-slate-800 p-4 rounded-2xl border border-[#D5CBB9] dark:border-slate-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch sử lượt tập</h4>
            {exerciseAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 text-center">Chưa có lượt tập nào được ghi nhận. Bấm "Bắt đầu" để trải nghiệm ngay!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exerciseAttempts.map((att, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-black/5 dark:border-white/5">
                    <span>Lượt {i + 1} - Cấp {att.level || exerciseLevel}</span>
                    <span className="font-bold text-brand-600">+{att.score} pts ({att.accuracyRate}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
