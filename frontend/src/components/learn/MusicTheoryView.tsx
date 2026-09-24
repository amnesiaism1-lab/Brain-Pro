import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NotesAndPitchModule } from './NotesAndPitchModule';
import { IntervalsModule } from './IntervalsModule';
import { ChordsModule } from './ChordsModule';
import { ScalesModule } from './ScalesModule';
import { RhythmModule } from './RhythmModule';
import { TimbreModule } from './TimbreModule';
import { SpatialAudioModule } from './SpatialAudioModule';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

export type TheoryModuleId = 'notes' | 'intervals' | 'chords' | 'scales' | 'rhythm' | 'timbre' | 'spatial';

interface ITheoryTab {
  id: TheoryModuleId;
  title: string;
  shortTitle: string;
  icon: string;
  component: React.ComponentType;
}

const THEORY_TABS: ITheoryTab[] = [
  { id: 'notes', title: '1. Nốt Nhạc & Cao Độ', shortTitle: 'Nốt & Cao Độ', icon: '🎹', component: NotesAndPitchModule },
  { id: 'intervals', title: '2. Quãng Âm (Intervals)', shortTitle: 'Quãng Âm', icon: '🎼', component: IntervalsModule },
  { id: 'chords', title: '3. Hợp Âm (Chords)', shortTitle: 'Hợp Âm', icon: '🎶', component: ChordsModule },
  { id: 'scales', title: '4. Âm Giai & Điệu Thức', shortTitle: 'Âm Giai', icon: '🎵', component: ScalesModule },
  { id: 'rhythm', title: '5. Nhịp Điệu & Phách', shortTitle: 'Nhịp Điệu', icon: '🥁', component: RhythmModule },
  { id: 'timbre', title: '6. Âm Sắc (Timbre)', shortTitle: 'Âm Sắc', icon: '🎸', component: TimbreModule },
  { id: 'spatial', title: '7. Âm Thanh 3D Không Gian', shortTitle: '3D Không Gian', icon: '🔊', component: SpatialAudioModule },
];

export const MusicTheoryView: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [activeModuleId, setActiveModuleId] = useState<TheoryModuleId>(() => {
    try {
      const saved = localStorage.getItem('be_last_theory_module');
      if (saved && THEORY_TABS.some(t => t.id === saved)) {
        return saved as TheoryModuleId;
      }
    } catch {}
    return 'notes';
  });

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
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
              Học lý thuyết, nghe thử trực quan và kết nối đàn piano MIDI trước khi bắt đầu luyện tập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MidiStatusIndicator />
          <button
            onClick={() => setActiveTab('exercises')}
            className="px-4 py-2 rounded-2xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-brand-200 dark:border-slate-700"
          >
            <Brain className="w-4 h-4" />
            <span>Vào Luyện Tập</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {THEORY_TABS.map((tab, idx) => {
            const isActive = activeModuleId === tab.id;
            const isCompleted = completedModules.includes(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectModule(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-102'
                    : 'bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.shortTitle}</span>
                {isCompleted && (
                  <CheckCircle className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-emerald-500'}`} />
                )}
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
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Bài trước</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-500">
          Chương {currentIndex + 1} / {THEORY_TABS.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === THEORY_TABS.length - 1}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentIndex === THEORY_TABS.length - 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 active:scale-95'
          }`}
        >
          <span>Bài tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
