import React, { useState } from 'react';
import { Scissors, FastForward, Clock, X, ChevronRight, Sliders, Check } from 'lucide-react';
import { formatTimeMs } from '../utils/vocalHelpers';

interface LeadingSilenceBannerProps {
  leadingSilenceMs: number;
  firstVocalOnsetMs: number;
  durationMs: number;
  onTrimSilence: (trimMs: number) => void;
  onSkipIntro: (targetMs: number) => void;
  onNudgeLyric?: (deltaMs: number) => void;
  onShiftLyricPhrases?: (deltaPhrases: number) => void;
  onDismiss?: () => void;
}

export const LeadingSilenceBanner: React.FC<LeadingSilenceBannerProps> = ({
  leadingSilenceMs,
  firstVocalOnsetMs,
  durationMs,
  onTrimSilence,
  onSkipIntro,
  onNudgeLyric,
  onShiftLyricPhrases,
  onDismiss,
}) => {
  const [showNudgeControls, setShowNudgeControls] = useState(false);
  const [nudgeFeedback, setNudgeFeedback] = useState<string | null>(null);

  // Suggest trimming up to 800ms before the first note to preserve natural breath lead-in
  const suggestedTrimMs = Math.max(0, firstVocalOnsetMs - 800);
  const skipTargetMs = Math.max(0, firstVocalOnsetMs - 1200);

  const silenceSecFormatted = (Math.round((leadingSilenceMs / 1000) * 10) / 10).toFixed(1);

  const handleNudge = (deltaMs: number) => {
    if (onNudgeLyric) {
      onNudgeLyric(deltaMs);
      const sign = deltaMs > 0 ? `+${deltaMs}ms` : `${deltaMs}ms`;
      setNudgeFeedback(`Đã dịch lời: ${sign}`);
      setTimeout(() => setNudgeFeedback(null), 2500);
    }
  };

  return (
    <div className="mx-1 sm:mx-2 my-1.5 p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/35 text-slate-200 shadow-lg backdrop-blur-md transition-all">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-amber-200 flex items-center gap-1.5">
                <span>Phát hiện đoạn trống/dạo đầu {silenceSecFormatted}s</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-300">
                Vocal bắt đầu lúc {formatTimeMs(firstVocalOnsetMs)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end lg:self-center">
          {suggestedTrimMs >= 1500 && (
            <button
              type="button"
              onClick={() => onTrimSilence(suggestedTrimMs)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
              title={`Cắt bỏ ${(Math.round(suggestedTrimMs / 100) / 10).toFixed(1)}s đoạn trống đầu để bài hát bắt đầu ngay từ giây 0:00 (giữ 0.8s lấy hơi)`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>✂️ Cắt bỏ đoạn trống ({silenceSecFormatted}s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSkipIntro(skipTargetMs)}
            className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title={`Tua đến ${formatTimeMs(skipTargetMs)} (trước nốt đầu 1.2s để đếm nhịp vào hát) mà không sửa file`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>⏭️ Nhảy tới nốt đầu</span>
          </button>

          {onNudgeLyric && (
            <button
              type="button"
              onClick={() => setShowNudgeControls(!showNudgeControls)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                showNudgeControls
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Tinh chỉnh độ lệch thời gian của lời bài hát (+/- ms)"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden sm:inline">Chỉnh lệch lyric</span>
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Đóng thông báo, giữ nguyên file gốc"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Optional Real-time Lyric Fine-Tuner Tray */}
      {showNudgeControls && onNudgeLyric && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Dịch toàn bộ lời:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleNudge(-500)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                -0.5s
              </button>
              <button
                type="button"
                onClick={() => handleNudge(-200)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                -0.2s
              </button>
              <button
                type="button"
                onClick={() => handleNudge(200)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                +0.2s
              </button>
              <button
                type="button"
                onClick={() => handleNudge(500)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                +0.5s
              </button>
            </div>
          </div>

          {onShiftLyricPhrases && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Khớp theo câu:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    onShiftLyricPhrases(-1);
                    setNudgeFeedback('Đã dịch lùi 1 câu lyric (-1 câu)');
                    setTimeout(() => setNudgeFeedback(null), 2500);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold transition"
                  title="Đẩy toàn bộ lời bài hát lùi 1 câu nếu lời đến chậm hơn nốt"
                >
                  ⏮️ Lùi 1 câu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onShiftLyricPhrases(1);
                    setNudgeFeedback('Đã dịch tiến 1 câu lyric (+1 câu)');
                    setTimeout(() => setNudgeFeedback(null), 2500);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold transition"
                  title="Đẩy toàn bộ lời bài hát tiến 1 câu nếu lời đến sớm hơn nốt"
                >
                  ⏭️ Tiến 1 câu
                </button>
              </div>
            </div>
          )}

          {nudgeFeedback && (
            <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 animate-fadeIn">
              <Check className="w-3 h-3" />
              <span>{nudgeFeedback}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

