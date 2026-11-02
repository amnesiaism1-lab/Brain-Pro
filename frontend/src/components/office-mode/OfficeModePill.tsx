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
  Sparkles
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
    togglePauseOfficeMode,
    toggleInfoPanel
  } = useAppStore();

  const { handleReplay, handleAnswer, handleNextOrSkip } = useOfficeMode();

  if (!officeModeActive || !officeSettings.showPill) {
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

  return (
    <aside
      role="region"
      aria-label="Chế độ văn phòng - Luyện tai ngầm"
      className={`fixed ${positionClasses} z-40 transition-all duration-300 animate-fade-in select-none`}
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
          officeQuestionState === 'feedback'
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
        {/* 1. Trạng thái: FEEDBACK (Đúng hoặc Sai) */}
        {officeQuestionState === 'feedback' && lastOfficeAnswerResult && (
          <div className="flex items-center gap-2 text-xs font-bold animate-scale-up">
            {lastOfficeAnswerResult.isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{lastOfficeAnswerResult.correctLabel}</span>
                {lastOfficeAnswerResult.awardedXp > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/40 text-[10px] text-emerald-100 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{lastOfficeAnswerResult.awardedXp} XP
                  </span>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                <span className="line-through opacity-75">{lastOfficeAnswerResult.selectedLabel}</span>
                <span className="font-extrabold text-amber-200">➔ {lastOfficeAnswerResult.correctLabel}</span>
              </>
            )}
          </div>
        )}

        {/* 2. Trạng thái: PAUSED */}
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

        {/* 3. Trạng thái: PLAYING AUDIO */}
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

        {/* 4. Trạng thái: WAITING FOR ANSWER */}
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

        {/* 5. Trạng thái: STANDBY (Đếm ngược) */}
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

        {/* Nút Info / Bảng thống kê (luôn có) */}
        <button
          onClick={() => toggleInfoPanel()}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
          title="Bảng thống kê & phím tắt (Alt+I)"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
