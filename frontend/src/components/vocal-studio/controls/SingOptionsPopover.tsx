import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  Headphones,
  Sparkles,
  Target,
  Clock,
  Radio,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TuningTolerance, TargetPitchMode } from '../types';
import { ToleranceSelector } from './ToleranceSelector';
import { MicDeviceSelector } from '../components/MicDeviceSelector';

interface SingOptionsPopoverProps {
  // Tier 2
  toleranceCents: TuningTolerance;
  onChangeTolerance: (val: TuningTolerance) => void;
  targetMode: TargetPitchMode;
  onChangeTargetMode: (val: TargetPitchMode) => void;
  smartOctaveFold: boolean;
  onToggleSmartOctaveFold: () => void;
  isLiveMonitoring: boolean;
  onToggleLiveMonitoring: () => void;
  onOpenPreflightModal?: () => void;

  // Tier 3 Advanced
  concertA4Hz: number;
  onChangeConcertA4Hz: (val: number) => void;
  latencyOffsetMs: number;
  onChangeLatencyOffsetMs: (val: number) => void;
  isWindowLocked: boolean;
  onToggleWindowLock: () => void;
  octaveConvention?: 'fl_studio' | 'international';
  onChangeOctaveConvention?: (val: 'fl_studio' | 'international') => void;
}

export const SingOptionsPopover: React.FC<SingOptionsPopoverProps> = ({
  toleranceCents,
  onChangeTolerance,
  targetMode,
  onChangeTargetMode,
  smartOctaveFold,
  onToggleSmartOctaveFold,
  isLiveMonitoring,
  onToggleLiveMonitoring,
  onOpenPreflightModal,
  concertA4Hz,
  onChangeConcertA4Hz,
  latencyOffsetMs,
  onChangeLatencyOffsetMs,
  isWindowLocked,
  onToggleWindowLock,
  octaveConvention = 'international',
  onChangeOctaveConvention,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition ${
          isOpen
            ? 'border-sky-500 bg-sky-950/60 text-sky-200'
            : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
        title="Tùy chọn luyện hát và cài đặt nâng cao"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Tùy Chọn Hát</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-xl p-4 z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white text-sm">Cài Đặt Luyện Hát</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            {/* 1. Microphone Picker */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 mb-1 block">
                Thiết bị Microphone
              </label>
              <MicDeviceSelector onOpenPreflightModal={onOpenPreflightModal} />
            </div>

            {/* 2. Tolerance Selector */}
            <div>
              <ToleranceSelector
                value={toleranceCents}
                onChange={onChangeTolerance}
                size="sm"
              />
            </div>

            {/* 3. Toggles Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Monitor Toggle */}
              <button
                type="button"
                onClick={onToggleLiveMonitoring}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  isLiveMonitoring
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
                title="Nghe lại trực tiếp tiếng micro qua tai nghe (cần cắm tai nghe tránh vọng)"
              >
                <div className="flex items-center justify-between">
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span className={`text-[10px] font-mono px-1 rounded ${isLiveMonitoring ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {isLiveMonitoring ? 'BẬT' : 'TẮT'}
                  </span>
                </div>
                <div className="font-bold text-xs mt-0.5">Nghe Giọng Mình</div>
                <span className="text-[10px] text-slate-400">Monitor tai nghe</span>
              </button>

              {/* Smart Octave-Fold Toggle */}
              <button
                type="button"
                onClick={onToggleSmartOctaveFold}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  smartOctaveFold
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
                title="Tự động bù quãng 8 khi Nam hát bài Nữ hoặc ngược lại"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className={`text-[10px] font-mono px-1 rounded ${smartOctaveFold ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                    {smartOctaveFold ? 'BẬT' : 'TẮT'}
                  </span>
                </div>
                <div className="font-bold text-xs mt-0.5">Gập Quãng 8</div>
                <span className="text-[10px] text-slate-400">Octave-Fold</span>
              </button>
            </div>

            {/* 4. Target Guidance Mode */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>Chế độ nốt đích</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangeTargetMode('quantized')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition text-center ${
                    targetMode === 'quantized'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chấm theo nốt nửa cung chuẩn (khuyến nghị)"
                >
                  Nốt Chuẩn (Mặc định)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTargetMode('original')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition text-center ${
                    targetMode === 'original'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chấm bám sát micro-pitch của file nhạc gốc"
                >
                  Bám Bản Gốc
                </button>
              </div>
            </div>

            {/* Octave Convention Selector */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Hệ Quy Chiếu Quãng 8</span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {octaveConvention === 'fl_studio' ? 'FL Studio (Middle C = C5)' : 'Quốc Tế (Middle C = C4)'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangeOctaveConvention?.('fl_studio')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition text-center ${
                    octaveConvention === 'fl_studio'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chuẩn FL Studio / NewTone: Middle C là C5"
                >
                  FL Studio (C5)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOctaveConvention?.('international')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition text-center ${
                    octaveConvention === 'international'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chuẩn Quốc Tế SPN / Piano: Middle C là C4"
                >
                  Quốc Tế (C4)
                </button>
              </div>
            </div>

            {/* 5. Advanced Collapsible (Tier 3) */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-400 hover:text-sky-300 font-semibold flex items-center justify-between w-full"
              >
                <span>Cài Đặt Nâng Cao (A4, Độ Trễ, Khóa Cửa Sổ)</span>
                <span>{showAdvanced ? '▲' : '▼'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 pt-2 pl-1">
                  {/* Concert A4 Pitch standard */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Tần số chuẩn A4:</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {[432, 440, 442].map((hz) => (
                        <button
                          key={hz}
                          type="button"
                          onClick={() => onChangeConcertA4Hz(hz)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            concertA4Hz === hz
                              ? 'bg-sky-500 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {hz}Hz
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Microphone Latency Compensation */}
                  <div>
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Bù độ trễ Mic:</span>
                      </div>
                      <span className="font-mono text-sky-400">{latencyOffsetMs > 0 ? `+${latencyOffsetMs}` : latencyOffsetMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={10}
                      value={latencyOffsetMs}
                      onChange={(e) => onChangeLatencyOffsetMs(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>

                  {/* Pitch window lock */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-300">Khóa trục cao độ dọc:</span>
                    <button
                      type="button"
                      onClick={onToggleWindowLock}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 font-bold text-[11px] ${
                        isWindowLocked
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isWindowLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{isWindowLocked ? 'Đã khóa' : 'Tự co giãn'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
