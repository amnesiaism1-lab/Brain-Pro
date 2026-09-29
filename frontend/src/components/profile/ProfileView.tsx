import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Flame, 
  Zap, 
  Trophy, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Brain, 
  Cloud, 
  RefreshCw, 
  LogOut, 
  LogIn, 
  CheckCircle2,
  Play,
  ArrowRight,
  Search,
  Music,
  Lock,
  Unlock,
  SlidersHorizontal,
  ChevronRight,
  Layers
} from 'lucide-react';
import { 
  EXERCISE_VARIANTS, 
  EXERCISES_METADATA, 
  ExerciseSlug, 
  CognitiveCategoryCode,
  INFINITY_ROMAN_NUMERALS 
} from '@brain-exercises/shared';
import { BrainMap } from '../cognition/BrainMap';

export const ProfileView: React.FC = () => {
  const { 
    xp, 
    level, 
    streak, 
    cognitiveSnapshots, 
    exerciseMasteries, 
    getExerciseLevel,
    setExerciseLevel,
    setSelectedExerciseSlug,
    setActiveGameSlug,
    authUser,
    setIsAuthModalOpen,
    logout,
    syncWithCloud,
    isSyncing,
    playSound
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'brain-map' | 'radar' | 'masteries'>('brain-map');
  const [exerciseFilterCategory, setExerciseFilterCategory] = useState<CognitiveCategoryCode | 'ALL'>('ALL');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

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

  // Compute Auditory score dynamically from 8 auditory exercises
  const auditorySlugs: ExerciseSlug[] = [
    'pitch-recall', 
    'interval-identify', 
    'rhythm-recall', 
    'chord-identify', 
    'timbre-match', 
    'sound-localization', 
    'voice-track', 
    'vocal-pitch-match'
  ];
  const auditoryLevels = auditorySlugs.map(s => getExerciseLevel(s) || 1);
  const currentAuditoryScore = Math.min(100, Math.round((auditoryLevels.reduce((a, b) => a + b, 0) / (auditorySlugs.length * 12)) * 60) + 40);
  const prevAuditoryScore = Math.max(30, currentAuditoryScore - 10);

  // 6-Axis Hexagonal Spider Radar
  const centerX = 140;
  const centerY = 140;
  const radius = 95;

  const points = [
    { label: 'Đọc nhanh', val: currentSnapshot.speedReadingScore, prevVal: prevSnapshot.speedReadingScore, angle: -Math.PI / 2 },
    { label: 'Thị giác', val: currentSnapshot.peripheralVisionScore, prevVal: prevSnapshot.peripheralVisionScore, angle: -Math.PI / 2 + Math.PI / 3 },
    { label: 'Tập trung', val: currentSnapshot.attentionScore, prevVal: prevSnapshot.attentionScore, angle: -Math.PI / 2 + (2 * Math.PI) / 3 },
    { label: 'Trí nhớ', val: currentSnapshot.memoryScore, prevVal: prevSnapshot.memoryScore, angle: -Math.PI / 2 + Math.PI },
    { label: 'Phản xạ', val: currentSnapshot.reactionScore, prevVal: prevSnapshot.reactionScore, angle: -Math.PI / 2 + (4 * Math.PI) / 3 },
    { label: 'Thính giác', val: currentAuditoryScore, prevVal: prevAuditoryScore, angle: -Math.PI / 2 + (5 * Math.PI) / 3 },
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

  // Filtered exercises for the Masteries tab
  const filteredExercises = useMemo(() => {
    return EXERCISES_METADATA.filter(ex => {
      const matchesCat = exerciseFilterCategory === 'ALL' || ex.categoryCode === exerciseFilterCategory;
      const matchesSearch = !exerciseSearchQuery || 
        ex.title.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
        ex.subtitle.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [exerciseFilterCategory, exerciseSearchQuery]);

  // Dynamic Badges based on real achievements
  const badges = [
    {
      id: 'eagle',
      title: 'Đại Bàng Thị Giác',
      desc: 'Bảng Schulte Cấp 9+ (Gorbov Đỏ-Đen)',
      icon: <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500" />,
      isUnlocked: getExerciseLevel('schulte-table') >= 9,
      progressText: `${getExerciseLevel('schulte-table')}/9`
    },
    {
      id: 'speed',
      title: 'Thần Tốc Đọc Nhanh',
      desc: 'RSVP Cấp 9+ (Hai Từ Song Hành)',
      icon: <Zap className="w-8 h-8 sm:w-9 sm:h-9 text-brand-500" />,
      isUnlocked: getExerciseLevel('rsvp-speed-reader') >= 9,
      progressText: `${getExerciseLevel('rsvp-speed-reader')}/9`
    },
    {
      id: 'streak',
      title: 'Bền Bỉ Kiên Trì',
      desc: 'Chuỗi luyện tập từ 5 ngày liên tiếp',
      icon: <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-500" />,
      isUnlocked: streak >= 5,
      progressText: `${streak}/5 ngày`
    },
    {
      id: 'golden-ear',
      title: 'Đôi Tai Vàng',
      desc: 'Dò Cao Độ hoặc Quãng đạt Cấp 5+',
      icon: <Music className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-400" />,
      isUnlocked: (getExerciseLevel('vocal-pitch-match') >= 5) || (getExerciseLevel('interval-identify') >= 5),
      progressText: `Cấp ${Math.max(getExerciseLevel('vocal-pitch-match'), getExerciseLevel('interval-identify'))}/5`
    },
    {
      id: 'network',
      title: 'Kiến Trúc Sư Quan Hệ',
      desc: 'Mạng Lưới Quan Hệ đạt Cấp 4+',
      icon: <Brain className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400" />,
      isUnlocked: getExerciseLevel('relational-network') >= 4,
      progressText: `Cấp ${getExerciseLevel('relational-network')}/4`
    },
    {
      id: 'infinity',
      title: 'Chiến Binh Vô Cực',
      desc: 'Mở khóa Cấp Vô Cực ở bất kỳ bài tập nào',
      icon: <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-purple-400" />,
      isUnlocked: Object.values(exerciseMasteries).some(m => (m.highestLevelReached || 0) > 12),
      progressText: Object.values(exerciseMasteries).some(m => (m.highestLevelReached || 0) > 12) ? 'Mở khóa' : 'Cần Cấp 13'
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8 animate-fade-in pb-28">
      {/* Profile Header Card */}
      <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {authUser?.avatarUrl ? (
            <img 
              src={authUser.avatarUrl} 
              alt={authUser.username}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-brand-500 shadow-xl shadow-brand-500/20 shrink-0" 
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-brand-600/30 shrink-0">
              {authUser ? authUser.username[0]?.toUpperCase() : 'K'}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                {authUser ? authUser.username : 'Khách Trải Nghiệm'}
              </h2>
              <span className="px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-black">
                Cấp {level}
              </span>
              {authUser && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Cloud
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {authUser ? authUser.email : 'Chế độ lưu trữ cục bộ • Chưa kích hoạt đồng bộ đám mây'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-500">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> {streak} ngày liên tiếp
              </span>
              <span>&bull;</span>
              <span className="text-brand-600 dark:text-brand-400 font-black">{xp} XP tích lũy</span>
              <span>&bull;</span>
              <span className="text-purple-600 dark:text-purple-400">{unlockedVariantsCount} / {EXERCISES_METADATA.length} biến thể Cấp 9+</span>
            </div>
          </div>
        </div>

        {/* Auth Action Buttons */}
        <div className="flex flex-row sm:flex-col items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          {authUser ? (
            <>
              <button
                onClick={() => {
                  playSound('click');
                  syncWithCloud();
                }}
                disabled={isSyncing}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-700 hover:bg-slate-50 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm transition-all btn-press"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ đám mây'}</span>
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  logout();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 transition-all btn-press"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                playSound('click');
                setIsAuthModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all btn-press active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Call-to-Action Banner */}
      {!authUser && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-amber-950/20 border-2 border-amber-300/80 dark:border-amber-800/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <Cloud className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Bảo toàn điểm số & Mở khóa đồng bộ đa thiết bị
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Bạn đang luyện tập ở chế độ Khách. Đăng nhập bằng Google để sao lưu {xp} XP và thành tích nhận thức vĩnh viễn lên Supabase PostgreSQL!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setIsAuthModalOpen(true);
            }}
            className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-md shrink-0 flex items-center gap-2 transition-all btn-press active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Đăng nhập Google Ngay</span>
          </button>
        </div>
      )}

      {/* 3 View Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#E8DFC8] dark:bg-slate-800/80 rounded-2xl w-fit border border-[#D5CBB9] dark:border-slate-700 shadow-sm">
        <button
          onClick={() => {
            playSound('click');
            setActiveTab('brain-map');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'brain-map'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Mạng Lưới 12 Quan Hệ Nhận Thức</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('radar');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'radar'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>6 Khối Năng Lực (Radar Chart)</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('masteries');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'masteries'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Toàn Bộ 31 Bài Tập & Biến Thể</span>
        </button>
      </div>

      {/* Tab 1: Brain Map */}
      {activeTab === 'brain-map' && (
        <div className="space-y-8 animate-fade-in">
          <BrainMap />
        </div>
      )}

      {/* Tab 2: Radar Chart & Badges */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-fade-in">
          {/* Left Column (lg:col-span-6): 6-Axis Hexagonal Radar Chart */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Biểu Đồ 6 Trục Năng Lực Não Bộ</h3>
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

              {/* SVG Hexagonal Spider Radar */}
              <div className="flex flex-col items-center justify-center py-2">
                <svg width="300" height="300" className="overflow-visible">
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
                        className="dark:stroke-slate-700"
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

                    const labelR = radius + 26;
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
          </div>

          {/* Right Column (lg:col-span-6): Dynamic Badges */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Huy Hiệu & Danh Hiệu Đạt Được</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Mở khóa qua các thành tựu rèn luyện thực tế</p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
                  {badges.filter(b => b.isUnlocked).length} / {badges.length} Đã mở
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                      b.isUnlocked
                        ? 'bg-white dark:bg-slate-700/80 border-amber-300 dark:border-amber-600/40 shadow-sm'
                        : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                    }`}
                  >
                    <div className="shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {b.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                          {b.title}
                        </h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          b.isUnlocked
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {b.isUnlocked ? 'ĐÃ ĐẠT' : b.progressText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All 31 Exercises Progression & Stage III Variants */}
      {activeTab === 'masteries' && (
        <div className="space-y-8 animate-fade-in">
          {/* Section A: Comprehensive 31 Exercises Grid */}
          <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-600" />
                  Tiến Trình Toàn Bộ 31 Bài Tập
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Cấp độ hiện tại, tỷ lệ chính xác và nút chơi nhanh cho từng bài tập
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={exerciseSearchQuery}
                    onChange={(e) => setExerciseSearchQuery(e.target.value)}
                    placeholder="Tìm tên bài tập..."
                    className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <select
                  value={exerciseFilterCategory}
                  onChange={(e) => setExerciseFilterCategory(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">Tất cả danh mục (31)</option>
                  <option value="SPEED_READING">Đọc nhanh</option>
                  <option value="PERIPHERAL_VISION">Thị giác ngoại vi</option>
                  <option value="ATTENTION">Tập trung</option>
                  <option value="MEMORY">Trí nhớ</option>
                  <option value="REACTION">Phản xạ</option>
                  <option value="AUDITORY_MEMORY">Cảm âm & Thính giác</option>
                </select>
              </div>
            </div>

            {/* Exercises Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredExercises.map((ex) => {
                const curLevel = getExerciseLevel(ex.slug) || 1;
                const isInfinity = curLevel > 12;
                const infinityTier = isInfinity ? curLevel - 12 : null;
                const mastery = exerciseMasteries[ex.slug];
                const accuracy = mastery?.avgAccuracy ? Math.round(mastery.avgAccuracy) : 0;
                const attempts = mastery?.totalAttempts || 0;

                return (
                  <div
                    key={ex.slug}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                          {ex.categoryCode === 'SPEED_READING' ? 'Đọc nhanh' :
                           ex.categoryCode === 'PERIPHERAL_VISION' ? 'Thị giác' :
                           ex.categoryCode === 'ATTENTION' ? 'Tập trung' :
                           ex.categoryCode === 'MEMORY' ? 'Trí nhớ' :
                           ex.categoryCode === 'REACTION' ? 'Phản xạ' : 'Cảm âm'}
                        </span>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isInfinity 
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/50' 
                            : 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                        }`}>
                          {isInfinity ? `Tier ${INFINITY_ROMAN_NUMERALS[infinityTier || 1]}` : `Cấp ${curLevel}/12`}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {ex.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {ex.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {attempts > 0 ? (
                          <span>{accuracy}% chính xác • {attempts} lượt</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa luyện tập</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            playSound('click');
                            setSelectedExerciseSlug(ex.slug);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          Cấp độ
                        </button>
                        <button
                          onClick={() => {
                            playSound('click');
                            setActiveGameSlug(ex.slug);
                          }}
                          className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tập</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Stage III Variants Gallery (with 1-click launch!) */}
          <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Biến Thể Đỉnh Cao (Stage III - Cấp 9-12)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Bấm vào biến thể đã mở khóa để vào tập ngay ở cấp độ đỉnh cao!
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                {unlockedVariantsCount} / {EXERCISES_METADATA.length} Đã mở
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
              {EXERCISE_VARIANTS.map((v) => {
                const currentExLevel = getExerciseLevel(v.exerciseSlug as any);
                const isUnlocked = currentExLevel >= v.minLevel;

                return (
                  <div
                    key={v.variantCode}
                    onClick={() => {
                      playSound('click');
                      if (isUnlocked) {
                        setExerciseLevel(v.exerciseSlug as any, v.minLevel);
                        setActiveGameSlug(v.exerciseSlug as any);
                      } else {
                        setSelectedExerciseSlug(v.exerciseSlug as any);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer btn-press ${
                      isUnlocked
                        ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 hover:border-purple-400 text-slate-800 dark:text-white shadow-sm hover:shadow-md'
                        : 'bg-white/40 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-90'
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

                    <button
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 transition-all shadow-sm ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      <span>{isUnlocked ? 'Tập ngay' : `Cấp ${v.minLevel}`}</span>
                      {isUnlocked && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
