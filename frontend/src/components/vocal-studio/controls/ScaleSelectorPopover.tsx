import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Music2,
  X,
  Sparkles,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpDown,
  Magnet,
} from 'lucide-react';
import { NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';
import { IKeyCandidate } from '../../../services/vocalFileAnalysisService';
import { ISelectedKeyOverride } from '../../../store/vocalStudioStore';

interface ScaleSelectorPopoverProps {
  selectedKeyOverride: ISelectedKeyOverride | null;
  onSelectKeyOverride: (key: ISelectedKeyOverride | null) => void;
  estimatedKey?: IKeyCandidate;
  topKeyCandidates?: IKeyCandidate[];
  snapToScale: boolean;
  onToggleSnapToScale: (val: boolean) => void;
  transposeSemitones: number;
  onChangeTranspose: (semitones: number) => void;
  octaveConvention?: 'fl_studio' | 'international';
  onChangeOctaveConvention?: (val: 'fl_studio' | 'international') => void;
}

const ROOTS = [
  { root: 'C', label: 'C', alt: 'Đô' },
  { root: 'C#', label: 'C#', alt: 'Db' },
  { root: 'D', label: 'D', alt: 'Rê' },
  { root: 'D#', label: 'D#', alt: 'Eb' },
  { root: 'E', label: 'E', alt: 'Mi' },
  { root: 'F', label: 'F', alt: 'Fa' },
  { root: 'F#', label: 'F#', alt: 'Gb' },
  { root: 'G', label: 'G', alt: 'Sol' },
  { root: 'G#', label: 'G#', alt: 'Ab' },
  { root: 'A', label: 'A', alt: 'La' },
  { root: 'A#', label: 'A#', alt: 'Bb' },
  { root: 'B', label: 'B', alt: 'Si' },
];

export const ScaleSelectorPopover: React.FC<ScaleSelectorPopoverProps> = ({
  selectedKeyOverride,
  onSelectKeyOverride,
  estimatedKey,
  topKeyCandidates = [],
  snapToScale,
  onToggleSnapToScale,
  transposeSemitones,
  onChangeTranspose,
  octaveConvention = 'fl_studio',
  onChangeOctaveConvention,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeRoot = selectedKeyOverride ? selectedKeyOverride.root : (estimatedKey?.root || 'C');
  const activeMode = selectedKeyOverride ? selectedKeyOverride.mode : (estimatedKey?.mode || 'major');

  const rootIdx = (NOTE_NAMES as readonly string[]).indexOf(activeRoot);
  const solfege = rootIdx >= 0 ? SOLFEGE_NAMES[rootIdx] : activeRoot;
  const currentKeyDisplay = `${activeRoot} ${activeMode === 'major' ? 'Trưởng' : 'Thứ'}`;

  // Scale notes calculation
  const scaleNotes = useMemo(() => {
    if (rootIdx < 0) return [];
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
    const intervals = activeMode === 'major' ? majorIntervals : minorIntervals;
    return intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]);
  }, [rootIdx, activeMode]);

  // Relative key
  const relativeKeyDisplay = useMemo(() => {
    if (rootIdx < 0) return '';
    if (activeMode === 'major') {
      const relIdx = (rootIdx + 9) % 12;
      return `${NOTE_NAMES[relIdx]} Thứ (${SOLFEGE_NAMES[relIdx]} Minor)`;
    } else {
      const relIdx = (rootIdx + 3) % 12;
      return `${NOTE_NAMES[relIdx]} Trưởng (${SOLFEGE_NAMES[relIdx]} Major)`;
    }
  }, [rootIdx, activeMode]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button: FL Studio NewTone Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition shadow-sm ${
          isOpen
            ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200'
            : selectedKeyOverride || transposeSemitones !== 0 || snapToScale
            ? 'border-indigo-500/80 bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900/60'
            : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
        title="Xem và chọn âm giai (Scale) hoặc dịch giọng (Transpose) như FL Studio NewTone"
      >
        <Music2 className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-mono text-indigo-200">{currentKeyDisplay}</span>
        {transposeSemitones !== 0 && (
          <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
            {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
          </span>
        )}
        {snapToScale && (
          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            Snap
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-xl p-4 z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-white text-sm">Âm Giai & Dịch Giọng</span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">FL NewTone Style</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar pr-1">
            {/* 1. Auto-detected Key Candidates */}
            {topKeyCandidates.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Gợi ý từ nhận diện file:
                  </span>
                  {selectedKeyOverride && (
                    <button
                      type="button"
                      onClick={() => onSelectKeyOverride(null)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Về tự động
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topKeyCandidates.map((cand, idx) => {
                    const isSelected =
                      activeRoot === cand.root && activeMode === cand.mode;
                    return (
                      <button
                        key={`${cand.root}-${cand.mode}-${idx}`}
                        type="button"
                        onClick={() =>
                          onSelectKeyOverride({ root: cand.root, mode: cand.mode })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition flex items-center gap-1 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200 shadow-sm'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                        <span>{cand.root} {cand.mode === 'major' ? 'Trưởng' : 'Thứ'}</span>
                        <span className="text-[10px] text-slate-400">({Math.round(cand.confidence * 100)}%)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Root Note Selector (12 Semitones) */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 block">
                Nốt Chủ Âm (Root Note)
              </label>
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {ROOTS.map((r) => {
                  const isSelected = activeRoot === r.root;
                  return (
                    <button
                      key={r.root}
                      type="button"
                      onClick={() =>
                        onSelectKeyOverride({ root: r.root, mode: activeMode })
                      }
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-indigo-500 bg-gradient-to-b from-indigo-900/80 to-indigo-950 text-white font-black shadow-md'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-mono">{r.label}</span>
                      <span className="text-[9px] text-slate-400">{r.alt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Mode Selector: Trưởng (Major) / Thứ (Minor) */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 block">
                Điệu Thức (Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSelectKeyOverride({ root: activeRoot, mode: 'major' })
                  }
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                    activeMode === 'major'
                      ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>Trưởng (Major)</span>
                  {activeMode === 'major' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSelectKeyOverride({ root: activeRoot, mode: 'minor' })
                  }
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                    activeMode === 'minor'
                      ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>Thứ (Minor)</span>
                  {activeMode === 'minor' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              </div>
            </div>

            {/* 4. Active Scale Notes Badge Preview */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Các nốt trong âm giai:</span>
                <span className="text-slate-400 text-[10px]">Song song: {relativeKeyDisplay}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {scaleNotes.map((n, i) => (
                  <span
                    key={`${n}-${i}`}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                      n === activeRoot
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Snap to Scale Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => onToggleSnapToScale(!snapToScale)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition ${
                  snapToScale
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Magnet className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-bold text-xs">Bám theo Scale (Snap to Scale)</div>
                    <div className="text-[10px] text-slate-400">
                      Tự động nắn nốt mẫu vào âm giai (Mặc định: TẮT)
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    snapToScale
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {snapToScale ? 'BẬT' : 'TẮT'}
                </span>
              </button>
            </div>

            {/* 6. Transpose (Dịch Giọng ±12 bán âm, tương đương TRANS núm NewTone) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dịch Giọng (Transpose - Núm TRANS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300">
                    {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} bán âm
                  </span>
                  {transposeSemitones !== 0 && (
                    <button
                      type="button"
                      onClick={() => onChangeTranspose(0)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Về tông gốc"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick transpose presets */}
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => onChangeTranspose(-12)}
                  className={`py-1.5 rounded-lg border font-mono transition ${
                    transposeSemitones === -12
                      ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title="Hạ 1 quãng 8 (hợp giọng nam hát bài nữ)"
                >
                  −12 (Nam)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTranspose(Math.max(-12, transposeSemitones - 1))}
                  className="py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 font-mono"
                  title="Hạ 1 bán âm"
                >
                  −1
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTranspose(0)}
                  className={`py-1.5 rounded-lg border font-mono transition ${
                    transposeSemitones === 0
                      ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title="Giữ nguyên tông gốc"
                >
                  0 (Gốc)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTranspose(Math.min(12, transposeSemitones + 1))}
                  className="py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 font-mono"
                  title="Tăng 1 bán âm"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTranspose(12)}
                  className={`py-1.5 rounded-lg border font-mono transition ${
                    transposeSemitones === 12
                      ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title="Tăng 1 quãng 8 (hợp giọng nữ hát bài nam)"
                >
                  +12 (Nữ)
                </button>
              </div>
            </div>

            {/* 4. Octave Convention (FL Studio NewTone vs International SPN) */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold text-[11px]">
                  Quy ước Quãng 8 (Octave Notation)
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {octaveConvention === 'fl_studio' ? 'FL Studio (Middle C = C5)' : 'Quốc Tế (Middle C = C4)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => onChangeOctaveConvention?.('fl_studio')}
                  className={`py-1.5 px-2 rounded-lg border font-mono transition flex flex-col items-center text-center ${
                    octaveConvention === 'fl_studio'
                      ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title="FL Studio NewTone: Đô giữa là C5, Sol giữa là G5"
                >
                  <span className="font-bold text-xs">FL Studio (C5 / G5)</span>
                  <span className="text-[9px] text-slate-400">Chuẩn NewTone DAW</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOctaveConvention?.('international')}
                  className={`py-1.5 px-2 rounded-lg border font-mono transition flex flex-col items-center text-center ${
                    octaveConvention === 'international'
                      ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title="Chuẩn Quốc Tế SPN: Đô giữa là C4, Sol giữa là G4"
                >
                  <span className="font-bold text-xs">Quốc Tế SPN (C4 / G4)</span>
                  <span className="text-[9px] text-slate-400">Chuẩn ISO Âm Học</span>
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                💡 Trong FL Studio, Middle C được gán nhãn là C5 (thay vì C4 theo chuẩn quốc tế). Tần số âm học của nốt Sol (~392Hz) không đổi giữa hai chuẩn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
