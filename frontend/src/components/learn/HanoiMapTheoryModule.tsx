import React, { useState, useMemo } from 'react';
import {
  Compass,
  Map as MapIcon,
  BookOpen,
  Trophy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Navigation,
  Clock,
  Zap,
  Brain,
  Layers,
  Waves,
  Route,
  TrainFront,
  Search,
  HelpCircle,
  Eye,
  GraduationCap
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  HANOI_THEORY_CHAPTERS,
  HANOI_LEARNING_STAGES
} from '@brain-exercises/shared';
import { HanoiMarkdownContent } from './HanoiMarkdownContent';
import { HanoiCartographicAtlas } from './hanoi/HanoiCartographicAtlas';
import { HanoiVisualSchematics } from './hanoi/HanoiVisualSchematics';
import { HanoiPracticeLab } from './hanoi/HanoiPracticeLab';

type MainWorkspaceTab =
  | 'interactive_map'
  | 'visual_schematics'
  | 'theory_chapters'
  | 'practice_lab';

const READ_CHAPTERS_KEY = 'be_hanoi_read_chapters_v1';

const PRACTICAL_MODES_SHORTCUTS = [
  { id: 'corridor_chain', code: 'A', title: 'Chuỗi Trục Đổi Tên', sub: 'Một đường 5–6 tên nối tiếp' },
  { id: 'cross_street_order', code: 'B', title: 'Thứ Tự Giao Cắt', sub: 'Đoán ngã tư tiếp theo dọc trục' },
  { id: 'which_intersection', code: 'C', title: 'Đứng Ngã Tư Nào?', sub: 'Nghe 2 phố khóa ngay nút giao' },
  { id: 'superblock_cell', code: 'D', title: 'Khối Ô Phố & Thoát', sub: 'Thoát ngõ sâu ra 4 đại lộ bao' },
  { id: 'address_decoder', code: 'E', title: 'Giải Mã Địa Chỉ', sub: 'Chẵn/lẻ, ngõ ngách & cổng phụ' },
  { id: 'route_planner_ab', code: 'F', title: 'Lập Tuyến A → B', sub: 'Tư duy phân cấp 3 tầng tối ưu' },
  { id: 'oneway_turn_trap', code: 'G', title: 'Phá Bẫy 1 Chiều & Làn', sub: 'Phố Pháp, VĐ2/VĐ3 trên cao, hầm' },
  { id: 'personal_anchor_drill', code: 'H', title: 'Đích Neo Cá Nhân', sub: 'Luyện từ Nhà / Công ty của bạn' },
  { id: 'gps_loss_recovery', code: 'I', title: 'Sinh Tồn Mất GPS', sub: 'Đọc sông, Metro, nắng & Skyline' }
];

export const HanoiMapTheoryModule: React.FC = () => {
  const {
    setSelectedExerciseSlug,
    setActiveGameSlug,
    markTheoryModuleMastered,
    masteredTheoryModules
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<MainWorkspaceTab>('interactive_map');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [revealedQuickCheckId, setRevealedQuickCheckId] = useState<string | null>(null);

  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_CHAPTERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleChapterCompleted = (chapterId: string) => {
    setCompletedChapterIds((prev) => {
      const exists = prev.includes(chapterId);
      const next = exists ? prev.filter((id) => id !== chapterId) : [...prev, chapterId];
      try {
        localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(next));
      } catch {}
      if (next.length >= HANOI_THEORY_CHAPTERS.length) {
        markTheoryModuleMastered('hanoi-map');
      }
      return next;
    });
  };

  const handleLaunchExercise = (modeParam?: string) => {
    try {
      if (modeParam) {
        sessionStorage.setItem('be_hanoi_preferred_mode', modeParam);
      }
    } catch {}
    setSelectedExerciseSlug('hanoi-navigation');
    setActiveGameSlug('hanoi-navigation');
  };

  const handleJumpToChapter = (chapterNumber: number) => {
    const idx = HANOI_THEORY_CHAPTERS.findIndex((c) => c.chapterNumber === chapterNumber);
    if (idx >= 0) {
      setActiveChapterIndex(idx);
      setActiveTab('theory_chapters');
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const filteredChapters = useMemo(() => {
    const q = chapterSearch.trim().toLowerCase();
    if (!q) return HANOI_THEORY_CHAPTERS;
    return HANOI_THEORY_CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.contentMarkdown.toLowerCase().includes(q)
    );
  }, [chapterSearch]);

  const activeChapter =
    HANOI_THEORY_CHAPTERS[activeChapterIndex] || HANOI_THEORY_CHAPTERS[0];
  const readProgressPct = Math.round(
    (completedChapterIds.length / HANOI_THEORY_CHAPTERS.length) * 100
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 space-y-6 animate-fade-in">
      {/* =====================================================================
          HERO ATLAS HEADER & PROGRESSIVE 4-STAGE LEARNING ARCHITECTURE
         ===================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-9 shadow-2xl border border-amber-500/25">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Học Viện Bản Đồ Nhận Thức & Định Vị Không Gian Thủ Đô</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Hệ Thống Lý Thuyết & Tư Duy{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
                  Bản Đồ Hà Nội Chuẩn Chuyên Gia
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Thiết kế theo phương pháp <strong>Gom cụm phân tầng (Spatial Chunking)</strong> &{' '}
                <strong>5 Nguyên tố Đô thị Kevin Lynch</strong>: đi tuần tự từ{' '}
                <strong className="text-sky-300">Khung Sông & 13 Cầu</strong> →{' '}
                <strong className="text-amber-300">6 Vành Đai & Đồng Hồ 12h</strong> →{' '}
                <strong className="text-purple-300">30 Quận/Huyện, Phố Pháp & Ô Phố</strong> →{' '}
                <strong className="text-emerald-300">Metro, Luật Làn & La Bàn Mặt Trời</strong>.
              </p>

              {/* Verified Quantitative Scope Badges (SVG Icons, Zero Emoji Slop) */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />4 Sông · 8 Hồ · 13 Cầu
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />6 Vành Đai (1 → 4) · 30 Quận/Huyện
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                  <Route className="w-3.5 h-3.5 text-orange-400" />Đồng Hồ 12h · Phố Pháp 1 Chiều
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                  <TrainFront className="w-3.5 h-3.5 text-emerald-400" />Metro 2A & 3 · BRT 01
                </span>
              </div>
            </div>

            {/* Right CTA & Study Progress Box */}
            <div className="w-full lg:w-72 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Tiến độ giáo trình:
                </span>
                <span className="font-mono font-black text-amber-300">
                  {completedChapterIds.length}/{HANOI_THEORY_CHAPTERS.length} chương ({readProgressPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.max(4, readProgressPct)}%` }}
                />
              </div>

              <button
                onClick={() => handleLaunchExercise()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer btn-press"
              >
                <Zap className="w-4 h-4" />
                <span>Vào Game Thực Chiến Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-slate-400">
                {masteredTheoryModules.includes('hanoi-map') ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã đạt chứng nhận Nắm Vững Lý Thuyết
                  </span>
                ) : (
                  '9 chế độ thực chiến · 12 cấp chuẩn + 10 cấp Vô Cực'
                )}
              </div>
            </div>
          </div>

          {/* 4-Stage Guided Learning Roadmap Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
            {HANOI_LEARNING_STAGES.map((st) => {
              const stageDoneCount = st.chapterNumbers.filter((num) => {
                const ch = HANOI_THEORY_CHAPTERS.find((c) => c.chapterNumber === num);
                return ch && completedChapterIds.includes(ch.id);
              }).length;

              return (
                <button
                  key={st.id}
                  onClick={() => handleJumpToChapter(st.chapterNumbers[0])}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <span>Bước {st.stageNumber} · Chương {st.chapterNumbers.join(', ')}</span>
                    <span className="text-emerald-300 font-mono">
                      {stageDoneCount}/{st.chapterNumbers.length}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-white line-clamp-1">
                    {st.title.replace(/^Giai Đoạn \d:\s*/, '')}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{st.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Main 4-Workspace Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              {
                id: 'interactive_map' as const,
                label: '1. Bản Đồ Atlas Tương Tác Đa Lớp',
                Icon: MapIcon
              },
              {
                id: 'visual_schematics' as const,
                label: '2. Sơ Đồ Tư Duy & Giải Phẫu Trực Quan',
                Icon: Compass
              },
              {
                id: 'theory_chapters' as const,
                label: '3. Giáo Trình 12 Chương Chuyên Sâu',
                Icon: BookOpen
              },
              {
                id: 'practice_lab' as const,
                label: '4. Phòng Lab Flashcards & Chẩn Đoán',
                Icon: Trophy
              }
            ].map((tab) => {
              const Icon = tab.Icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          WORKSPACE 1: INTERACTIVE CARTOGRAPHIC ATLAS + 9 PRACTICAL DRILLS
         ===================================================================== */}
      {activeTab === 'interactive_map' && (
        <div className="space-y-6">
          <HanoiCartographicAtlas onLaunchExercise={handleLaunchExercise} />

          {/* 9 Practical Game Modes Direct Matrix */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Chuyển Hóa Lý Thuyết Sang 9 Chế Độ Phản Xạ Thực Chiến (Modes A → I)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bấm vào bất kỳ chuyên đề nào bên dưới để vào thẳng chế độ luyện tập tương ứng trong Game
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRACTICAL_MODES_SHORTCUTS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleLaunchExercise(m.id)}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      {m.code}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {m.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.sub}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          WORKSPACE 2: INTERACTIVE VISUAL SCHEMATICS & INFOGRAPHICS
         ===================================================================== */}
      {activeTab === 'visual_schematics' && (
        <HanoiVisualSchematics onLaunchExercise={handleLaunchExercise} />
      )}

      {/* =====================================================================
          WORKSPACE 3: 12-CHAPTER MASTERCLASS CURRICULUM (4 STAGES)
         ===================================================================== */}
      {activeTab === 'theory_chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Syllabus Navigation Grouped by Stage */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
            {/* Search Box */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Tìm kiếm khái niệm, tên phố, cầu..."
                  aria-label="Tìm kiếm nội dung trong 12 chương"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            {/* Stage-Grouped Chapters */}
            <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
              {HANOI_LEARNING_STAGES.map((stage) => {
                const stageChapters = filteredChapters.filter((c) => c.stageId === stage.id);
                if (stageChapters.length === 0) return null;

                return (
                  <div key={stage.id} className="space-y-2">
                    <div className="px-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        {stage.title}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {stageChapters.map((chap) => {
                        const globalIdx = HANOI_THEORY_CHAPTERS.findIndex((c) => c.id === chap.id);
                        const isSelected = activeChapter.id === chap.id;
                        const isDone = completedChapterIds.includes(chap.id);

                        return (
                          <button
                            key={chap.id}
                            onClick={() => {
                              setActiveChapterIndex(globalIdx);
                              setRevealedQuickCheckId(null);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl transition-all border flex flex-col gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-[#D5CBB9]/80 dark:border-slate-800 hover:border-amber-400/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                  Chương {chap.chapterNumber}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  {chap.difficulty}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isDone && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {chap.readTimeMin}p
                                </span>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                              {chap.title}
                            </h4>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Editorial Study Reader */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-6">
            <article className="space-y-6">
              {/* Chapter Kicker & Title */}
              <header className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      Chương {activeChapter.chapterNumber} · {activeChapter.badge}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Độ sâu: {activeChapter.difficulty} · {activeChapter.readTimeMin} phút đọc
                    </span>
                  </div>

                  <button
                    onClick={() => toggleChapterCompleted(activeChapter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      completedChapterIds.includes(activeChapter.id)
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {completedChapterIds.includes(activeChapter.id)
                        ? 'Đã hoàn thành chương'
                        : 'Đánh dấu đã học xong'}
                    </span>
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                  {activeChapter.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  {activeChapter.subtitle}
                </p>
              </header>

              {/* Neural & Cognitive Mechanism Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
                  <strong>Cơ chế Khoa học Nhận thức & Thần kinh học:</strong>{' '}
                  {activeChapter.cognitiveMechanism}
                </div>
              </div>

              {/* Executive Key Takeaways */}
              <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/50 space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Tóm Tắt 3 Quy Luật Cốt Lõi Của Chương</span>
                </h3>
                <ul className="space-y-2">
                  {activeChapter.keyTakeaways.map((point, pIdx) => (
                    <li
                      key={pIdx}
                      className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {pIdx + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Editorial Markdown Body */}
              <div className="py-2">
                <HanoiMarkdownContent content={activeChapter.contentMarkdown} />
              </div>

              {/* Active-Recall 10-Second Self-Check Box */}
              <div className="p-5 rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/25 border border-emerald-400/45 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Tự Kiểm Tra Phản Xạ 10 Giây Trước Khi Qua Chương Mới</span>
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  {activeChapter.quickCheck.question}
                </p>

                {revealedQuickCheckId === activeChapter.id ? (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-xs sm:text-sm text-slate-800 dark:text-emerald-100 leading-relaxed">
                    <strong className="text-emerald-700 dark:text-emerald-400">Đáp án:</strong>{' '}
                    {activeChapter.quickCheck.answer}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRevealedQuickCheckId(activeChapter.id);
                      if (!completedChapterIds.includes(activeChapter.id)) {
                        toggleChapterCompleted(activeChapter.id);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer btn-press"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lật Xem Đáp Án & Hoàn Thành Chương</span>
                  </button>
                )}
              </div>

              {/* Direct Practice Bridge + Prev/Next Chapter Footer */}
              <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <button
                  onClick={() => handleLaunchExercise(activeChapter.recommendedPracticeMode)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Zap className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                  <span>{activeChapter.recommendedPracticeLabel}</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  <button
                    disabled={activeChapterIndex === 0}
                    onClick={() => {
                      setActiveChapterIndex((prev) => Math.max(0, prev - 1));
                      setRevealedQuickCheckId(null);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    ← Chương Trước
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {activeChapterIndex + 1}/{HANOI_THEORY_CHAPTERS.length}
                  </span>
                  <button
                    disabled={activeChapterIndex === HANOI_THEORY_CHAPTERS.length - 1}
                    onClick={() => {
                      setActiveChapterIndex((prev) =>
                        Math.min(HANOI_THEORY_CHAPTERS.length - 1, prev + 1)
                      );
                      setRevealedQuickCheckId(null);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 cursor-pointer"
                  >
                    Chương Tiếp →
                  </button>
                </div>
              </footer>
            </article>
          </div>
        </div>
      )}

      {/* =====================================================================
          WORKSPACE 4: FLASHCARDS & DIAGNOSTIC ASSESSMENT LAB
         ===================================================================== */}
      {activeTab === 'practice_lab' && (
        <HanoiPracticeLab
          onJumpToChapter={handleJumpToChapter}
          onMastered={() => markTheoryModuleMastered('hanoi-map')}
          onLaunchExercise={handleLaunchExercise}
        />
      )}
    </div>
  );
};
