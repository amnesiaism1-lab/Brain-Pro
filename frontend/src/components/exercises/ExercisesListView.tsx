import React, { useState, useEffect } from 'react';
import { 
  Shuffle, 
  Grid, 
  Maximize2, 
  Award, 
  Gauge, 
  FileSearch
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EXERCISES_METADATA, CognitiveCategoryCode } from '@brain-exercises/shared';

// Map slugs to representative custom graphic icons matching app screenshots
function renderExerciseIcon(slug: string) {
  switch (slug) {
    case 'anagram':
      return (
        <div className="flex flex-col items-center justify-center text-[10px] font-black tracking-tighter leading-none text-white">
          <span className="text-[9px] opacity-80">ANAGRAM</span>
          <Shuffle className="w-5 h-5 my-0.5" />
          <span className="text-[9px] opacity-80">NARGAMA</span>
        </div>
      );
    case 'schulte-table':
      return (
        <div className="grid grid-cols-3 gap-0.5 text-[9px] font-extrabold text-white text-center leading-none p-1">
          <span>4</span><span>2</span><span>9</span>
          <span>5</span><span className="bg-white/30 rounded-full">1</span><span>3</span>
          <span>6</span><span>8</span><span>7</span>
        </div>
      );
    case 'find-letter':
      return (
        <div className="relative flex items-center justify-center w-full h-full text-white">
          <div className="absolute text-[8px] opacity-40 font-mono">B X E\n1 A D\nM M C</div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-lg text-white shadow">
            A
          </div>
        </div>
      );
    case 'find-number':
      return (
        <div className="relative flex items-center justify-center w-full h-full text-white">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-lg text-white shadow">
            9
          </div>
        </div>
      );
    case 'even-odd':
      return (
        <div className="flex items-center justify-center font-black text-sm text-white bg-white/20 rounded-full w-9 h-9 shadow">
          4/7
        </div>
      );
    case 'digit-span':
      return (
        <div className="flex flex-col items-center justify-center text-center font-mono text-[9px] text-white leading-tight">
          <span className="opacity-70">43289</span>
          <span className="font-extrabold text-base tracking-wider text-amber-300">???</span>
          <span className="opacity-70">61857</span>
        </div>
      );
    case 'rsvp-speed-reader':
      return (
        <div className="flex items-center justify-center font-black text-sm text-white tracking-widest">
          <span>O</span><span className="text-red-400">N</span><span>E</span>
        </div>
      );
    case 'word-search':
      return (
        <div className="grid grid-cols-4 gap-0.5 text-[7px] font-mono text-white text-center p-0.5">
          <span>B</span><span>X</span><span>E</span><span>X</span>
          <span>T</span><span>O</span><span>P</span><span>S</span>
          <span className="font-bold text-amber-300">M</span><span className="font-bold text-amber-300">A</span><span className="font-bold text-amber-300">M</span><span className="font-bold text-amber-300">A</span>
        </div>
      );
    case 'twin-words':
      return (
        <div className="flex flex-col text-[7px] font-bold font-mono text-white text-center leading-tight">
          <span>MAMA MOP</span>
          <span>META BETA</span>
        </div>
      );
    case 'peripheral-vision':
      return (
        <div className="relative flex items-center justify-center w-full h-full text-white">
          <Maximize2 className="w-7 h-7 text-white/90" />
          <span className="absolute text-[8px] font-bold">K &bull; K</span>
        </div>
      );
    case 'green-dot':
      return (
        <div className="relative flex flex-col justify-center items-center gap-1 w-full p-2">
          <div className="w-full h-1 bg-white/30 rounded" />
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80 animate-ping" />
          <div className="w-full h-1 bg-white/30 rounded" />
        </div>
      );
    case 'word-chunking':
      return (
        <div className="flex flex-col gap-1 items-center justify-center w-full p-1.5">
          <div className="w-7 h-2.5 bg-white/80 rounded" />
          <div className="w-10 h-2.5 bg-white rounded" />
        </div>
      );
    case 'reading-assessment':
      return (
        <div className="flex items-center justify-center text-white">
          <Award className="w-7 h-7" />
        </div>
      );
    case 'reading-pacer':
      return (
        <div className="flex items-center justify-center text-white">
          <Gauge className="w-7 h-7" />
        </div>
      );
    case 'text-scanning':
      return (
        <div className="flex items-center justify-center text-white">
          <FileSearch className="w-7 h-7" />
        </div>
      );
    case 'card-flip':
      return (
        <div className="flex items-center justify-center gap-1 text-white">
          <div className="w-5 h-7 rounded border border-white/60 bg-white/20 -rotate-6 shadow flex items-center justify-center text-[9px] font-black">
            ✦
          </div>
          <div className="w-5 h-7 rounded border border-white bg-amber-400 text-slate-900 rotate-6 shadow flex items-center justify-center text-[9px] font-black">
            ✦
          </div>
        </div>
      );
    case 'stroop-clash':
      return (
        <div className="flex flex-col items-center justify-center text-center font-black leading-tight">
          <span className="text-[10px] text-amber-300">ĐỎ</span>
          <span className="text-[10px] text-emerald-300">XANH</span>
        </div>
      );
    case 'spatial-memory':
      return (
        <div className="grid grid-cols-3 gap-0.5 p-1">
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-amber-300 shadow" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-amber-300 shadow" />
          <div className="w-3 h-3 rounded-sm bg-amber-300 shadow" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
        </div>
      );
    case 'saccade-tracker':
      return (
        <div className="relative flex items-center justify-center w-full h-full text-white">
          <div className="w-8 h-8 rounded-full border border-dashed border-white/40 flex items-center justify-center">
            <span className="font-mono font-black text-rose-300 text-xs">X</span>
          </div>
        </div>
      );
    default:
      return <Grid className="w-6 h-6 text-white" />;
  }
}

export const ExercisesListView: React.FC = () => {
  const { 
    setSelectedExerciseSlug, 
    getExerciseLevel, 
    lastPlayedSlug, 
    lastViewedExerciseSlug,
    playSound 
  } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<CognitiveCategoryCode | 'ALL'>('ALL');
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  // Restore scroll to the last viewed exercise card seamlessly
  useEffect(() => {
    if (lastViewedExerciseSlug) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`exercise-card-${lastViewedExerciseSlug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedSlug(lastViewedExerciseSlug);
          setTimeout(() => setHighlightedSlug(null), 1800);
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [lastViewedExerciseSlug]);

  const categories: Array<{ id: CognitiveCategoryCode | 'ALL'; label: string }> = [
    { id: 'ALL', label: `Tất cả (${EXERCISES_METADATA.length})` },
    { id: 'SPEED_READING', label: 'Đọc nhanh' },
    { id: 'PERIPHERAL_VISION', label: 'Thị giác ngoại vi' },
    { id: 'ATTENTION', label: 'Tập trung' },
    { id: 'MEMORY', label: 'Trí nhớ' },
    { id: 'REACTION', label: 'Phản xạ' }
  ];

  const filteredExercises = EXERCISES_METADATA.filter(ex => 
    selectedCategory === 'ALL' || ex.categoryCode === selectedCategory
  );

  const handleOpenDetail = (slug: string) => {
    playSound('click');
    setSelectedExerciseSlug(slug as any);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-28">
      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              playSound('click');
              setSelectedCategory(cat.id);
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 btn-press ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-[#F5EFE6] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#D5CBB9] dark:border-slate-700 hover:border-brand-500'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Responsive Grid of 19 Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredExercises.map((exercise) => {
          const exLevel = getExerciseLevel(exercise.slug as any);
          const stageName = exLevel >= 9 ? 'Siêu Phàm' : exLevel >= 5 ? 'Bứt Phá' : 'Khởi Động';
          const isSynergyCandidate = lastPlayedSlug && lastPlayedSlug !== exercise.slug && (
            (lastPlayedSlug === 'schulte-table' && exercise.slug === 'peripheral-vision') ||
            (lastPlayedSlug === 'peripheral-vision' && exercise.slug === 'schulte-table') ||
            (lastPlayedSlug === 'rsvp-speed-reader' && exercise.slug === 'reading-assessment') ||
            (lastPlayedSlug === 'stroop-clash' && exercise.slug === 'even-odd')
          );

          return (
            <div
              key={exercise.id}
              id={`exercise-card-${exercise.slug}`}
              onClick={() => handleOpenDetail(exercise.slug)}
              className={`w-full bg-[#F5EFE6] dark:bg-slate-800/95 border rounded-3xl p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-300 cursor-pointer btn-press group relative overflow-hidden ${
                highlightedSlug === exercise.slug 
                  ? 'border-brand-500 ring-4 ring-brand-500/40 shadow-xl scale-[1.02]' 
                  : 'border-[#D5CBB9] dark:border-slate-700'
              }`}
            >
              {/* Left Deep Blue Square Icon Box */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-600 dark:bg-brand-700 flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/25 group-hover:scale-105 transition-transform overflow-hidden">
                {renderExerciseIcon(exercise.slug)}
              </div>

              {/* Right Title & Subtitle */}
              <div className="flex-1 min-w-0 pr-1 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white truncate">
                    {exercise.title}
                  </h3>
                  {isSynergyCandidate && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0 shadow-sm animate-pulse">
                      ⚡ +25%
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {exercise.subtitle}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                    {exercise.categoryName}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Cấp {exLevel}/12
                  </span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${
                    exLevel >= 9 
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' 
                      : exLevel >= 5
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {stageName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
