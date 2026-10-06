import React from 'react';

interface DifficultyBadgeProps {
  difficulty: 'Dễ' | 'Trung bình' | 'Thử thách' | 'Nâng cao' | string;
  size?: 'sm' | 'md';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, size = 'sm' }) => {
  let style = 'bg-slate-800 text-slate-300 border-slate-700';

  if (difficulty === 'Dễ') {
    style = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
  } else if (difficulty === 'Trung bình') {
    style = 'bg-amber-950/80 text-amber-300 border-amber-500/30';
  } else if (difficulty === 'Thử thách' || difficulty === 'Nâng cao') {
    style = 'bg-rose-950/80 text-rose-300 border-rose-500/30';
  }

  const sizeClass = size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-mono font-bold border ${sizeClass} ${style}`}>
      {difficulty}
    </span>
  );
};
