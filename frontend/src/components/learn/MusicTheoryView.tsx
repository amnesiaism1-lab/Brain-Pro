import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NotesAndPitchModule } from './NotesAndPitchModule';
import { IntervalsModule } from './IntervalsModule';
import { ChordsModule } from './ChordsModule';
import { ScalesModule } from './ScalesModule';
import { RhythmModule } from './RhythmModule';
import { TimbreModule } from './TimbreModule';
import { SpatialAudioModule } from './SpatialAudioModule';
import { PolyphonyModule } from './PolyphonyModule';
import { SoundNetworkModule } from './SoundNetworkModule';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import {
  THEORY_MODULE_MAP,
  TheoryModuleId
} from './theoryExerciseMap';
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
  Mic,
  Eye,
  Award
} from 'lucide-react';

interface ITheoryTabItem {
  id: TheoryModuleId;
  title: string;
  shortTitle: string;
  icon: string;
  component: React.ComponentType;
}

const THEORY_TABS: ITheoryTabItem[] = [
  { id: 'notes', title: '1. Nốt Nhạc & Cao Độ', shortTitle: 'Nốt & Cao Độ', icon: '🎹', component: NotesAndPitchModule },
  { id: 'intervals', title: '2. Quãng Âm (Intervals)', shortTitle: 'Quãng Âm', icon: '🎼', component: IntervalsModule },
  { id: 'chords', title: '3. Hợp Âm (Chords)', shortTitle: 'Hợp Âm', icon: '🎶', component: ChordsModule },
  { id: 'scales', title: '4. Âm Giai & Điệu Thức', shortTitle: 'Âm Giai', icon: '🎵', component: ScalesModule },
  { id: 'rhythm', title: '5. Nhịp Điệu & Phách', shortTitle: 'Nhịp Điệu', icon: '🥁', component: RhythmModule },
  { id: 'timbre', title: '6. Âm Sắc (Timbre)', shortTitle: 'Âm Sắc', icon: '🎸', component: TimbreModule },
  { id: 'spatial', title: '7. Âm Thanh 3D Không Gian', shortTitle: '3D Không Gian', icon: '🔊', component: SpatialAudioModule },
  { id: 'polyphony', title: '8. Đa Thanh & Bè Phối', shortTitle: 'Đa Thanh & Bè', icon: '🪈', component: PolyphonyModule },
  { id: 'sound-network', title: '9. Mạng Lưới Hòa Âm & Cảm Âm Nâng Cao', shortTitle: 'Mạng Hòa Âm & Cảm Âm', icon: '⚡', component: SoundNetworkModule },
];

export const MusicTheoryView: React.FC = () => {
  const {
    setActiveTab,
    activeTheoryModuleId,
    setActiveTheoryModuleId,
    setSelectedExerciseSlug,
    getExerciseLevel,
    theoryHighlightEntity,
    setTheoryHighlightEntity,
    masteredTheoryModules
  } = useAppStore();

  const [activeModuleId, setActiveModuleId] = useState<TheoryModuleId>(() => {
    try {
      const saved = localStorage.getItem('be_last_theory_module');
      if (saved && THEORY_TABS.some(t => t.id === saved)) {
        return saved as TheoryModuleId;
      }
    } catch {}
    return 'notes';
  });

  useEffect(() => {
    if (activeTheoryModuleId && THEORY_TABS.some(t => t.id === activeTheoryModuleId)) {
      setActiveModuleId(activeTheoryModuleId as TheoryModuleId);
      setActiveTheoryModuleId(null);
    }
  }, [activeTheoryModuleId, setActiveTheoryModuleId]);

  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('be_completed_theory_modules');
      return saved ? JSON.parse(saved) : ['notes'];
    } catch {
      return ['notes'];
    }
  });

  const currentIndex = THEORY_TABS.findIndex(t => t.id === activeModuleId);
  const currentTab = THEORY_TABS[currentIndex] || THEORY_TABS[0];
  const ActiveComponent = currentTab.component;
  const currentMeta = THEORY_MODULE_MAP[activeModuleId] || THEORY_MODULE_MAP.notes;

  // Determine mastery for a given module: either explicitly marked, or primary exercise level >= 2
  const isModuleMastered = (id: TheoryModuleId): boolean => {
    if (masteredTheoryModules.includes(id)) return true;
    const meta = THEORY_MODULE_MAP[id];
    if (!meta) return false;
    const level = getExerciseLevel(meta.primarySlug);
    return level >= 2;
  };

  const masteredCount = THEORY_TABS.filter(t => isModuleMastered(t.id)).length;
  const progressPercent = Math.round((masteredCount / THEORY_TABS.length) * 100);

  const handleSelectModule = (id: TheoryModuleId) => {
    setActiveModuleId(id);
    try {
      localStorage.setItem('be_last_theory_module', id);
      if (!completedModules.includes(id)) {
        const next = [...completedModules, id];
        setCompletedModules(next);
        localStorage.setItem('be_completed_theory_modules', JSON.stringify(next));
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentIndex < THEORY_TABS.length - 1) {
      handleSelectModule(THEORY_TABS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectModule(THEORY_TABS[currentIndex - 1].id);
    }
  };

  const handleStartPrimaryExercise = () => {
    setSelectedExerciseSlug(currentMeta.primarySlug);
    setActiveTab('exercises');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Highlight Banner if navigating from a wrong-answer remediation */}
      {theoryHighlightEntity && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200">
              Đang xem cẩm nang ôn tập cho thực thể: <strong>{theoryHighlightEntity}</strong> — Hãy thử tương tác núm vặn bên dưới để nhận biết rõ sự khác biệt!
            </span>
          </div>
          <button
            onClick={() => setTheoryHighlightEntity(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold shrink-0 transition-colors"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Lý Thuyết & Khuôn Hình Âm Thanh
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  Interactive Ear Academy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Hiểu bản chất sóng âm, vặn thử thuộc tính và trải nghiệm 12 quan hệ nhận thức trước khi làm bài
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <MidiStatusIndicator />
            {/* Contextual CTA for active module */}
            <button
              onClick={handleStartPrimaryExercise}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all"
            >
              <Brain className="w-4 h-4" />
              <span>{currentMeta.ctaLabelVi}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cognitive & Mastery Sub-bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trọng tâm nhận thức:</span>
            <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              {currentMeta.relationBadgeVi}
            </span>
          </div>

          {/* Academy Mastery Progress */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Tiến độ làm chủ:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{masteredCount}/9 chương ({progressPercent}%)</strong>
            </div>
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs with 3-tier status */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {THEORY_TABS.map((tab) => {
            const isActive = activeModuleId === tab.id;
            const isMastered = isModuleMastered(tab.id);
            const isVisited = completedModules.includes(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectModule(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-102 ring-2 ring-brand-400'
                    : isMastered
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70'
                    : isVisited
                    ? 'bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                    : 'bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.shortTitle}</span>

                {/* Status Indicator */}
                {isMastered ? (
                  <CheckCircle className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                ) : isVisited ? (
                  <Eye className={`w-3 h-3 ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Module Content */}
      <main className="w-full">
        <ActiveComponent />
      </main>

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Bài trước</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">
            Chương {currentIndex + 1} / {THEORY_TABS.length}
          </span>
          {isModuleMastered(activeModuleId) && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              <CheckCircle className="w-3 h-3" /> Đã làm chủ
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === THEORY_TABS.length - 1}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentIndex === THEORY_TABS.length - 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 active:scale-95 cursor-pointer'
          }`}
        >
          <span>Bài tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
