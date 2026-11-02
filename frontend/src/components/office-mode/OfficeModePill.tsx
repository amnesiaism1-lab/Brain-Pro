import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useOfficeMode } from '../../hooks/useOfficeMode';
import {
  Headphones,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  Info,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Music2
} from 'lucide-react';

export const OfficeModePill: React.FC = () => {
  const {
    officeModeActive,
    officeModePaused,
    officeSettings,
    currentOfficeQuestion,
    officeQuestionState,
    lastOfficeAnswerResult,
    officeSession,
    secondsUntilNext,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel
  } = useAppStore();

  const { handleReplay, handleAnswer, handleFreestylePlayOption, handleNextOrSkip } = useOfficeMode();

  // Nếu người dùng tắt hoàn toàn tính năng hiển thị Pill trong Settings
  if (!officeSettings.showPill) {
    return null;
  }

  // Định vị trí viên nang theo cấu hình
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6'
  }[officeSettings.pillPosition || 'bottom-right'];

  // Định dạng thời gian đếm ngược mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // NẾU OFFICE MODE ĐANG TẮT: Hiển thị thanh mini launcher nhỏ gọn để người dùng biết tính năng ở đâu và có thể bật nhanh
  if (!officeModeActive) {
    return (
      <aside
        role="region"
        aria-label="Khởi động Chế độ Văn phòng"
        className={`fixed ${positionClasses} z-40 transition-all duration-300 animate-fade-in select-none`}
      >
        <button
          onClick={() => toggleInfoPanel(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/80 shadow-lg backdrop-blur-md text-xs font-bold transition-all cursor-pointer group hover:scale-105 active:scale-95"
          title="Nhấn để mở Bảng điều khiển & Hướng dẫn Chế độ Văn phòng (Alt+Q để bật)"
        >
          <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:text-indigo-300">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span>Chế độ Văn phòng</span>
          <kbd className="px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-600 rounded text-[9px] font-mono">
            Alt+Q
          </kbd>
        </button>
      </aside>
    );
  }

  return (
    <aside
      role="region"
      aria-label="Chế độ văn phòng - Luyện tai ngầm"
      className={`fixed ${positionClasses} z-40 transition-all duration-300 animate-fade-in select-none`}
    >
      <div
        className={`flex flex-col gap-2 p-3 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
          officeQuestionState === 'freestyle'
            ? 'bg-slate-900/98 text-white border-amber-500/70 shadow-amber-500/20 max-w-sm'
            : officeQuestionState === 'feedback'
            ? lastOfficeAnswerResult?.isCorrect
              ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-500/20'
              : 'bg-rose-600/95 text-white border-rose-400 shadow-rose-500/20'
            : officeModePaused
            ? 'bg-amber-600/95 text-white border-amber-400/50 shadow-amber-500/20'
            : officeQuestionState === 'playing'
            ? 'bg-indigo-600/95 text-white border-indigo-400/50 shadow-indigo-500/20 animate-pulse'
            : officeQuestionState === 'waiting'
            ? 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-indigo-500/60 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
            : 'bg-slate-900/90 text-white border-slate-700/80 shadow-black/40 hover:border-slate-500'
        }`}
      >
        {/* 1. Trạng thái: FREESTYLE REVIEW (Ôn tập & Thử nghiệm tự do khi trả lời sai) */}
        {officeQuestionState === 'freestyle' && lastOfficeAnswerResult && currentOfficeQuestion ? (
          <div className="space-y-2.5 animate-scale-up text-left">
            {/* Header: Đối chiếu Sai vs Đúng */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-through">{lastOfficeAnswerResult.selectedLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-black text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Đúng: {lastOfficeAnswerResult.correctLabel}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {lastOfficeAnswerResult.semitones} nửa cung
                  </span>
                </div>
              </div>

              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                Freestyle
              </span>
            </div>

            {/* Mẹo nhận diện */}
            {(lastOfficeAnswerResult.mnemonicSongVi || lastOfficeAnswerResult.tipVi) && (
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {lastOfficeAnswerResult.mnemonicSongVi || lastOfficeAnswerResult.tipVi}
                </span>
              </div>
            )}

            {/* Bàn phím thử nghiệm tự do (Bấm nghe thử đối chiếu các đáp án) */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">
                Bấm phím 1..{currentOfficeQuestion.options.length} hoặc click để nghe thử tự do:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {currentOfficeQuestion.options.map((opt) => (
                  <button
                    key={opt.index}
                    onClick={() => handleFreestylePlayOption(opt.index)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      opt.isCorrect
                        ? 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                        : opt.index === lastOfficeAnswerResult.selectedIndex
                        ? 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/60 text-rose-300'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                    title={`Bấm phím ${opt.index} để nghe`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center font-mono font-bold">
                        {opt.index}
                      </span>
                      <span className="truncate max-w-[90px]">{opt.code}</span>
                    </span>
                    <Music2 className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-800">
              <button
                onClick={handleReplay}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Nghe lại đề bài (Alt+R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nghe lại (Alt+R)</span>
              </button>

              <button
                onClick={handleNextOrSkip}
                className="px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/20 active:scale-95"
                title="Chuyển sang câu tiếp theo (Alt+N hoặc Enter/Space)"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <kbd className="px-1 bg-brand-700 rounded text-[9px] font-mono">Alt+N</kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {/* 2. Trạng thái: FEEDBACK ĐÚNG */}
            {officeQuestionState === 'feedback' && lastOfficeAnswerResult && (
              <div className="flex items-center gap-2 text-xs font-bold animate-scale-up">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{lastOfficeAnswerResult.correctLabel}</span>
                {lastOfficeAnswerResult.awardedXp > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/40 text-[10px] text-emerald-100 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{lastOfficeAnswerResult.awardedXp} XP
                  </span>
                )}
              </div>
            )}

            {/* 3. Trạng thái: PAUSED */}
            {officeModePaused && (
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-amber-200 animate-pulse" />
                <span className="text-xs font-bold text-amber-100">Đang tạm dừng</span>
                <button
                  onClick={togglePauseOfficeMode}
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Tiếp tục (Alt+P)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            )}

            {/* 4. Trạng thái: PLAYING AUDIO */}
            {!officeModePaused && officeQuestionState === 'playing' && (
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-200 animate-bounce" />
                <span className="text-xs font-bold text-indigo-100">Đang phát âm thanh...</span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-indigo-200 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-indigo-100 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-indigo-300 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}

            {/* 5. Trạng thái: WAITING FOR ANSWER */}
            {!officeModePaused && officeQuestionState === 'waiting' && currentOfficeQuestion && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800">
                  Cấp {currentOfficeQuestion.level}
                </span>

                {/* Các nút đáp án */}
                <div className="flex items-center gap-1.5">
                  {currentOfficeQuestion.options.map((opt) => (
                    <button
                      key={opt.index}
                      onClick={() => handleAnswer(opt.index)}
                      className="group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-sm"
                      title={`Phím tắt: Alt+${opt.index} hoặc gõ phím ${opt.index}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-700 group-hover:bg-indigo-700 text-[10px] flex items-center justify-center font-mono font-bold">
                        {opt.index}
                      </span>
                      <span className="text-xs">{opt.code}</span>
                    </button>
                  ))}
                </div>

                {/* Nút nghe lại */}
                <button
                  onClick={handleReplay}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Nghe lại (Alt+R)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Nút bỏ qua */}
                <button
                  onClick={handleNextOrSkip}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Bỏ qua câu này (Alt+N)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 6. Trạng thái: STANDBY (Đếm ngược) */}
            {!officeModePaused && officeQuestionState === 'standby' && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-brand-400">
                  <Headphones className="w-4 h-4" />
                </div>

                {/* Streak dots */}
                <div className="flex items-center gap-0.5" title={`Chuỗi đúng: ${officeSession.currentStreak}`}>
                  {[...Array(Math.min(5, Math.max(1, officeSession.currentStreak)))].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < officeSession.currentStreak ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                  {officeSession.currentStreak > 5 && (
                    <span className="text-[10px] font-mono text-amber-400 ml-0.5 font-bold">
                      +{officeSession.currentStreak - 5}
                    </span>
                  )}
                </div>

                {/* Đồng hồ đếm ngược hoặc nhãn On-Demand */}
                {officeSettings.mode === 'drip' ? (
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {formatTimer(secondsUntilNext)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                    Theo yêu cầu
                  </span>
                )}

                {/* Nút phát ngay câu mới */}
                <button
                  onClick={handleNextOrSkip}
                  className="p-1 rounded-lg bg-brand-600/80 hover:bg-brand-600 text-white transition-colors cursor-pointer"
                  title="Phát câu mới ngay (Alt+N)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            )}

            {/* Nút Info / Bảng thống kê & Hướng dẫn (luôn có) */}
            <button
              onClick={() => toggleInfoPanel()}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
              title="Bảng điều khiển & Hướng dẫn sử dụng (Alt+I)"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
