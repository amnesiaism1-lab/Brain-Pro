import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, ChevronLeft, Eye, Crosshair, Sparkles, Zap, Trophy, Target, 
  BarChart3, Settings2, Info, CheckCircle2, ShieldCheck, Flame, BookOpen, Type
} from 'lucide-react';
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
    attemptsHistory,
    playSound 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'stats'>('settings');

  // Exercise stimulus preference (Letters vs Speed Reading Words)
  const [stimulusMode, setStimulusMode] = useState<'letters' | 'words'>(() => {
    try {
      const saved = localStorage.getItem('be_pref_peripheral_stimulus');
      if (saved === 'words' || saved === 'letters') return saved;
    } catch {}
    return 'letters';
  });

  // Session rounds preference (6, 10, 15 rounds)
  const [sessionRounds, setSessionRounds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('be_pref_peripheral_rounds');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 10;
  });

  // Test flash preview state
  const [isPreviewFlashing, setIsPreviewFlashing] = useState(false);

  if (!selectedExerciseSlug) return null;

  const exercise = EXERCISES_METADATA.find(e => e.slug === selectedExerciseSlug);
  if (!exercise) return null;

  const exerciseLevel = getExerciseLevel(exercise.slug);
  const currentConfig = exercise.levelConfigs.find(c => c.level === exerciseLevel) || exercise.levelConfigs[0];

  const handleStartGame = () => {
    playSound('click');
    setActiveGameSlug(exercise.slug);
  };

  const handleStimulusChange = (mode: 'letters' | 'words') => {
    playSound('click');
    setStimulusMode(mode);
    try {
      localStorage.setItem('be_pref_peripheral_stimulus', mode);
    } catch {}
  };

  const handleRoundsChange = (rounds: number) => {
    playSound('click');
    setSessionRounds(rounds);
    try {
      localStorage.setItem('be_pref_peripheral_rounds', String(rounds));
    } catch {}
  };

  const exerciseAttempts = attemptsHistory.filter(a => a.exerciseSlug === exercise.slug);
  const bestScore = exerciseAttempts.length > 0 ? Math.max(...exerciseAttempts.map(a => a.score)) : 450;
  const avgAccuracy = exerciseAttempts.length > 0 
    ? Math.round(exerciseAttempts.reduce((s, a) => s + (a.accuracyRate || 95), 0) / exerciseAttempts.length)
    : 94;

  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  const stageInfo = useMemo(() => {
    if (exerciseLevel >= 9) {
      return {
        name: 'Giai đoạn III: Siêu Phàm (Biến Thể Đột Phá)',
        badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-300',
        stageDesc: 'Thử thách đa chiều, kích thích cận biên võng mạc và nhận diện nhiều mục tiêu đồng thời.'
      };
    }
    if (exerciseLevel >= 5) {
      return {
        name: 'Giai đoạn II: Bứt Phá (Khẩu Độ Mở Rộng)',
        badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300',
        stageDesc: 'Mở rộng thị trường ngoại vi lên góc 30°–45°, rút ngắn thời gian chớp xuống dưới 400ms.'
      };
    }
    return {
      name: 'Giai đoạn I: Khởi Động (Định Tâm & Neo Mắt)',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300',
      stageDesc: 'Rèn luyện khả năng khóa chặt con ngươi tại tâm, ngăn chặn phản xạ đảo mắt vô thức.'
    };
  }, [exerciseLevel]);

  // Specific visual parameters for Peripheral Vision
  const isPeripheral = exercise.slug === 'peripheral-vision';
  const spanPx = (currentConfig.parametersJson as any)?.spanPx || (120 + (exerciseLevel * 45));
  const flashMs = (currentConfig.parametersJson as any)?.flashDurationMs || Math.max(200, 750 - (exerciseLevel * 45));
  const visualAngleDeg = Math.round(Math.min(65, 15 + (exerciseLevel * 3.8)));

  const triggerTestFlash = () => {
    if (isPreviewFlashing) return;
    playSound('click');
    setIsPreviewFlashing(true);
    setTimeout(() => {
      setIsPreviewFlashing(false);
    }, flashMs);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 animate-fade-in pb-28">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={() => {
            playSound('click');
            const lastSlug = exercise.slug;
            setSelectedExerciseSlug(null);
            setTimeout(() => {
              const el = document.getElementById(`exercise-card-${lastSlug}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 60);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-[#D5CBB9] dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500 shadow-sm transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài tập</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            {exercise.categoryName}
          </span>
          <span className="text-xs font-black text-slate-500 hidden sm:inline">
            Cấp {exerciseLevel}/12
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 sm:p-7 shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {exercise.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {exercise.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Tiến trình thành thạo</span>
              <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                Cấp {exerciseLevel} / 12
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-brand-500/25">
              {exerciseLevel}
            </div>
          </div>
        </div>

        {/* 2 Sub-tabs: CÀI ĐẶT & THÔNG SỐ | THỐNG KÊ */}
        <div className="grid grid-cols-2 gap-2 mt-6 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('settings');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>CÀI ĐẶT & THÔNG SỐ BÀI TẬP</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('stats');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>LỊCH SỬ & THỐNG KÊ</span>
          </button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="space-y-6">
          {/* SPECIAL SECTION: Interactive Cockpit Visual Simulator (Only for Peripheral Vision) */}
          {isPeripheral && (
            <div className="bg-slate-950 rounded-3xl border-2 border-brand-500/40 p-5 sm:p-6 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
                    Mô Phỏng Không Gian Thị Giác Ngoại Vi (Cấp {exerciseLevel})
                  </span>
                </div>
                <button
                  onClick={triggerTestFlash}
                  disabled={isPreviewFlashing}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isPreviewFlashing ? 'Đang chớp...' : 'Xem thử 1 nhịp chớp'}</span>
                </button>
              </div>

              {/* Visual Radar Scope Area */}
              <div className="relative h-44 sm:h-52 my-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80 select-none">
                {/* Visual Field Arc Guides */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0,transparent_70%)] pointer-events-none" />
                <div className="absolute w-72 h-72 rounded-full border border-slate-800/40 pointer-events-none" />
                <div className="absolute w-44 h-44 rounded-full border border-slate-800/30 pointer-events-none" />
                <div className="absolute w-full h-[1px] bg-slate-800/60 pointer-events-none" />

                {/* Center Fixation Crosshair & Reticle (Zero horizontal text obstruction) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-500/30 shadow-lg shadow-rose-500 animate-pulse" />
                  <div className="absolute w-8 h-[1px] bg-rose-500/50" />
                  <div className="absolute h-8 w-[1px] bg-rose-500/50" />
                </div>

                {/* Relocated Bottom Badge - Eliminates Horizontal Axis Collisions */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-rose-500/30 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                    Tâm Neo Cố Định
                  </span>
                </div>

                {/* Left Peripheral Target Marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 z-10"
                  style={{ 
                    left: `calc(50% - ${Math.max(85, Math.min(160, 68 + (exerciseLevel * 9.5)))}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`font-mono font-black text-2xl sm:text-3xl transition-all ${
                    isPreviewFlashing 
                      ? 'text-cyan-300 opacity-100 drop-shadow-[0_0_14px_rgba(34,211,238,1)]' 
                      : 'text-cyan-500/40 opacity-40'
                  }`}>
                    {stimulusMode === 'words' ? 'NÃO' : 'A'}
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400/70 mt-1 whitespace-nowrap">Biên Trái</span>
                </div>

                {/* Right Peripheral Target Marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 z-10"
                  style={{ 
                    left: `calc(50% + ${Math.max(85, Math.min(160, 68 + (exerciseLevel * 9.5)))}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`font-mono font-black text-2xl sm:text-3xl transition-all ${
                    isPreviewFlashing 
                      ? 'text-cyan-300 opacity-100 drop-shadow-[0_0_14px_rgba(34,211,238,1)]' 
                      : 'text-cyan-500/40 opacity-40'
                  }`}>
                    {stimulusMode === 'words' ? 'MẮT' : 'K'}
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400/70 mt-1 whitespace-nowrap">Biên Phải</span>
                </div>
              </div>

              {/* Real-time Scientific Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Độ mở góc nhìn</span>
                  <span className="text-sm font-black text-cyan-400">~{visualAngleDeg}° ngoại vi</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Khoảng cách biên</span>
                  <span className="text-sm font-black text-amber-400">{spanPx} px</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Thời gian lưu ảnh</span>
                  <span className="text-sm font-black text-emerald-400">{flashMs} ms</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Loại kích thích</span>
                  <span className="text-sm font-black text-purple-400">
                    {stimulusMode === 'words' ? 'Từ vựng đọc' : 'Ký tự chữ'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Level Progression Timeline (1 to 12) */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Chọn Cấp Độ Huấn Luyện (1 – 12)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stageInfo.stageDesc}
                </p>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border self-start sm:self-auto ${stageInfo.badgeColor}`}>
                {stageInfo.name}
              </span>
            </div>

            {/* 12 Levels Carousel / Grid with Stage Accents */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-2.5 pt-2">
              {allLevels.map((lvl) => {
                const isSelected = exerciseLevel === lvl;
                const isStage3 = lvl >= 9;
                const isStage2 = lvl >= 5 && lvl <= 8;

                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      playSound('click');
                      setExerciseLevel(exercise.slug, lvl);
                    }}
                    className={`h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all duration-150 btn-press relative ${
                      isSelected
                        ? isStage3
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-4 ring-purple-300 dark:ring-purple-900 scale-105'
                          : isStage2
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/40 ring-4 ring-brand-300 dark:ring-brand-900 scale-105'
                            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-emerald-300 dark:ring-emerald-900 scale-105'
                        : isStage3
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800'
                          : isStage2
                            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 border border-brand-200 dark:border-brand-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <span>{lvl}</span>
                    <span className="text-[9px] font-semibold opacity-75">
                      {isStage3 ? 'Siêu' : isStage2 ? 'Bứt' : 'Khởi'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stage III Breakthrough Variant Banner */}
            {currentConfig.variantName && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 flex items-center gap-2.5 animate-scale-up">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <span className="text-xs font-black text-purple-900 dark:text-purple-200 block">
                    Đột Phá Cấp Cao: {currentConfig.variantName}
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 opacity-90">
                    Yêu cầu kết hợp xử lý thị giác song song, không chuyển trục mắt sang hai bên.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Meaningful Training Configuration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stimulus Type Card (Only for exercises supporting word/letter switch like peripheral vision) */}
            {isPeripheral ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Đối Tượng Kích Thích Thị Giác
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Chọn loại mục tiêu chớp sáng ở vùng biên ngoại vi:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleStimulusChange('letters')}
                    className={`p-3 rounded-2xl border text-left transition-all btn-press ${
                      stimulusMode === 'letters'
                        ? 'bg-brand-50/80 dark:bg-brand-950/50 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white">
                      <Type className="w-4 h-4 text-brand-600" />
                      <span>Ký tự chữ cái</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kích hoạt tế bào que nhận diện ký hiệu đơn lập
                    </p>
                  </button>

                  <button
                    onClick={() => handleStimulusChange('words')}
                    className={`p-3 rounded-2xl border text-left transition-all btn-press ${
                      stimulusMode === 'words'
                        ? 'bg-brand-50/80 dark:bg-brand-950/50 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span>Từ vựng đọc nhanh</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rèn chụp ảnh cả khối từ ngữ bách khoa (Tony Buzan)
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Generic Grid / Item Summary Card for other exercises */
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-600" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Quy Mô & Cấu Trúc Đề Bài
                  </h4>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  {currentConfig.gridRows && currentConfig.gridCols && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kích thước ma trận:</span>
                      <strong className="text-slate-800 dark:text-white">{currentConfig.gridRows} × {currentConfig.gridCols} ô</strong>
                    </div>
                  )}
                  {currentConfig.targetItemCount && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số mục tiêu cần tìm:</span>
                      <strong className="text-brand-600 dark:text-brand-400">{currentConfig.targetItemCount} mục tiêu</strong>
                    </div>
                  )}
                  {currentConfig.speedWpm && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tốc độ nhịp đọc:</span>
                      <strong className="text-amber-600 dark:text-amber-400">{currentConfig.speedWpm} WPM</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian quy chuẩn:</span>
                    <strong className="text-slate-800 dark:text-white">{currentConfig.timeLimitSec} giây</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Session Volume / Rounds Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Cường Độ Phiên Tập
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Chọn số lượt thử thách cho phiên rèn luyện này:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { count: 6, label: 'Khởi động', sub: '6 lượt' },
                  { count: 10, label: 'Tiêu chuẩn', sub: '10 lượt' },
                  { count: 15, label: 'Chuyên sâu', sub: '15 lượt' }
                ].map(r => (
                  <button
                    key={r.count}
                    onClick={() => handleRoundsChange(r.count)}
                    className={`p-2.5 rounded-2xl border text-center transition-all btn-press ${
                      sessionRounds === r.count
                        ? 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 dark:text-orange-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black block">{r.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{r.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Adaptive Difficulty Engine Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-[#D5CBB9] dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Tự Động Thích Ứng Độ Khó (Adaptive Engine)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động nâng cấp độ khi độ chính xác ≥ 85% và hạ cấp khi gặp khó khăn liên tiếp.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('click');
                  setAutoDifficulty(!autoDifficulty);
                }}
                className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${
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
          </div>

          {/* Section 4: Deep Neuroscience & Practice Rationale Card */}
          <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl border border-amber-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Cơ Sở Khoa Học & Giá Trị Nhận Thức Thực Tế
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">
                  1. Giải Phóng Tế Bào Que (Rod Cells)
                </strong>
                Mắt người có 120 triệu tế bào que ở biên võng mạc. Bài tập kích hoạt khả năng bắt mẫu hình rộng tới 180° thay vì chỉ dùng 2° hố mắt hẹp.
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">
                  2. Giảm Lần Nhảy Mắt (Fixations)
                </strong>
                Người đọc bình thường nhảy mắt 6–8 lần/dòng. Mở rộng tầm nhìn ngoại vi giúp giảm chỉ còn 1–2 lần/dòng, bứt phá tốc độ 800+ WPM.
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">
                  3. Quy Tắc Vàng Khi Luyện
                </strong>
                Tuyệt đối khóa chặt ánh nhìn vào tâm đỏ. Hãy thả lỏng cơ mắt và để não bộ tự động bao quát hai biên mà không cần liếc mắt.
              </div>
            </div>
          </div>

          {/* Big Action CTA Button */}
          <div className="pt-2">
            <button
              onClick={handleStartGame}
              className="w-full py-5 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black text-lg sm:text-xl shadow-2xl shadow-brand-600/40 flex items-center justify-center gap-3 btn-press transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>BẮT ĐẦU LUYỆN TẬP (CẤP {exerciseLevel})</span>
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: THỐNG KÊ CHI TIẾT */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-[#D5CBB9] dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Điểm Kỷ Lục</span>
              <p className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-1">{bestScore}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-[#D5CBB9] dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Độ Chính Xác TB</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgAccuracy}%</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-[#D5CBB9] dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 font-medium">Số Phiên Đã Tập</span>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{exerciseAttempts.length}</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lịch Sử Các Phiên Rèn Luyện
              </h4>
              <span className="text-xs font-semibold text-slate-400">
                Gần nhất
              </span>
            </div>

            {exerciseAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Chưa có lượt tập nào được ghi nhận. Bấm "Bắt đầu" để kiểm tra phản xạ và mở rộng trường nhìn ngay bây giờ!
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {exerciseAttempts.slice(0, 10).map((att, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Cấp {att.level || exerciseLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {att.accuracyRate}% chính xác
                      </span>
                      <span className="font-black text-brand-600">
                        +{att.score} pts
                      </span>
                    </div>
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
