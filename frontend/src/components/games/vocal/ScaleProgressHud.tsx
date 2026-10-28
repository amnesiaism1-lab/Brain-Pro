import React from 'react';
import { TargetNoteItem } from './vocalTargetGenerators';
import { Music, Sparkles } from 'lucide-react';

interface ScaleProgressHudProps {
  scaleMeta?: {
    id: string;
    nameVi: string;
    root: string;
    feel?: string;
    allScaleNotes: string[];
  };
  targets: TargetNoteItem[];
  activeNoteIndex: number;
}

export const ScaleProgressHud: React.FC<ScaleProgressHudProps> = ({
  scaleMeta,
  targets,
  activeNoteIndex
}) => {
  if (!scaleMeta && targets.length <= 1) {
    return null;
  }

  const currentTarget = targets[activeNoteIndex] || targets[0];

  return (
    <div className="w-full flex flex-col gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Music className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                {scaleMeta?.nameVi || 'Chuỗi Xướng Âm'}
              </span>
              {scaleMeta?.root && (
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Chủ âm: {scaleMeta.root}
                </span>
              )}
            </div>
            {scaleMeta?.feel && (
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {scaleMeta.feel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-mono uppercase text-slate-400">Nốt hiện tại:</span>
          <span className="text-xs font-bold text-amber-300 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40">
            {currentTarget.note} ({currentTarget.solfege}) {currentTarget.degree ? `• Bậc ${currentTarget.degree}` : ''}
          </span>
        </div>
      </div>

      {/* Note Sequence Pills Runway */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {targets.map((item, idx) => {
          const isActive = idx === activeNoteIndex;
          const isPassed = idx < activeNoteIndex;

          return (
            <div
              key={`${item.note}-${idx}`}
              className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[58px] py-1.5 px-2 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105 font-black ring-2 ring-emerald-400/50'
                  : isPassed
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400/80 font-bold'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
              }`}
            >
              <span className="text-xs font-mono font-bold leading-tight">{item.note}</span>
              <span className={`text-[9px] leading-tight ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                {item.degree ? `Bậc ${item.degree}` : item.solfege}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
