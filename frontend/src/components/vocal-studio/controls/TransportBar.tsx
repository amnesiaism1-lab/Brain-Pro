import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Repeat,
  Award,
} from 'lucide-react';
import { SpeedControl } from './SpeedControl';
import { SingOptionsPopover } from './SingOptionsPopover';
import { TuningTolerance, TargetPitchMode } from '../types';

interface TransportBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTimeMs: number;
  durationMs: number;
  onSeek: (ms: number) => void;
  onSkip: (seconds: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (spd: number) => void;
  musicVolume: number;
  onChangeVolume: (vol: number) => void;
  isMutedMusic: boolean;
  onToggleMuteMusic: () => void;
  isLoopingActive: boolean;
  onToggleLoop: () => void;
  onViewReport: () => void;

  // Options popover props
  toleranceCents: TuningTolerance;
  onChangeTolerance: (val: TuningTolerance) => void;
  targetMode: TargetPitchMode;
  onChangeTargetMode: (val: TargetPitchMode) => void;
  smartOctaveFold: boolean;
  onToggleSmartOctaveFold: () => void;
  isLiveMonitoring: boolean;
  onToggleLiveMonitoring: () => void;
  onOpenPreflightModal?: () => void;
  concertA4Hz: number;
  onChangeConcertA4Hz: (val: number) => void;
  latencyOffsetMs: number;
  onChangeLatencyOffsetMs: (val: number) => void;
  isWindowLocked: boolean;
  onToggleWindowLock: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  onTogglePlay,
  currentTimeMs,
  durationMs,
  onSeek,
  onSkip,
  playbackSpeed,
  onChangeSpeed,
  musicVolume,
  onChangeVolume,
  isMutedMusic,
  onToggleMuteMusic,
  isLoopingActive,
  onToggleLoop,
  onViewReport,
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
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
      {/* 1. Scrubber Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 w-11 text-right">
          {formatTime(currentTimeMs)}
        </span>

        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={Math.max(1, durationMs)}
            value={currentTimeMs}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-400 w-11">
          {formatTime(durationMs)}
        </span>
      </div>

      {/* 2. Primary Playback & Tooling Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Transport buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Về đầu bài (Phím R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSkip(-3)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:inline-flex"
            title="Lùi 3 giây (Phím ←)"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            title="Phát / Tạm dừng (Phím Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Tạm Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                <span>Hát Theo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSkip(3)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:inline-flex"
            title="Tiến 3 giây (Phím →)"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2 sm:p-2.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${
              isLoopingActive
                ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-sm'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
            title="Bật/Tắt lặp lại đoạn A-B (Phím L)"
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden md:inline">{isLoopingActive ? 'Đang Lặp' : 'Lặp A-B'}</span>
          </button>
        </div>

        {/* Center: Speed Control */}
        <div className="hidden lg:block">
          <SpeedControl speed={playbackSpeed} onChange={onChangeSpeed} />
        </div>

        {/* Right: Audio Volume, Sing Options Popover & Report Action */}
        <div className="flex items-center gap-2">
          {/* Music Volume & Mute */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={onToggleMuteMusic}
              className="text-slate-400 hover:text-white transition p-1"
              title={isMutedMusic ? 'Bật lại tiếng nhạc mẫu (Phím M)' : 'Tắt tiếng nhạc mẫu (Phím M)'}
            >
              {isMutedMusic ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMutedMusic ? 0 : musicVolume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              title="Âm lượng nhạc mẫu"
            />
          </div>

          {/* Sing Options Popover */}
          <SingOptionsPopover
            toleranceCents={toleranceCents}
            onChangeTolerance={onChangeTolerance}
            targetMode={targetMode}
            onChangeTargetMode={onChangeTargetMode}
            smartOctaveFold={smartOctaveFold}
            onToggleSmartOctaveFold={onToggleSmartOctaveFold}
            isLiveMonitoring={isLiveMonitoring}
            onToggleLiveMonitoring={onToggleLiveMonitoring}
            onOpenPreflightModal={onOpenPreflightModal}
            concertA4Hz={concertA4Hz}
            onChangeConcertA4Hz={onChangeConcertA4Hz}
            latencyOffsetMs={latencyOffsetMs}
            onChangeLatencyOffsetMs={onChangeLatencyOffsetMs}
            isWindowLocked={isWindowLocked}
            onToggleWindowLock={onToggleWindowLock}
          />

          {/* View Report Button */}
          <button
            type="button"
            onClick={onViewReport}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            title="Xem báo cáo kết quả lượt hát"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Báo Cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
