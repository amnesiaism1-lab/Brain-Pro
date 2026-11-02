import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Headphones,
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Award,
  Zap,
  Target,
  Keyboard,
  Sliders,
  Sparkles
} from 'lucide-react';

export const OfficeModeInfoPanel: React.FC = () => {
  const {
    officeModeActive,
    officeModePaused,
    isInfoPanelOpen,
    officeSettings,
    officeSession,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel,
    updateOfficeSettings,
    resetOfficeSession
  } = useAppStore();

  if (!isInfoPanelOpen) return null;

  const sessionMinutes = Math.floor((Date.now() - officeSession.startedAt) / 60000);
  const accuracy = officeSession.totalAnswered > 0
    ? Math.round((officeSession.correctCount / officeSession.totalAnswered) * 100)
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bảng thông tin Chế độ Văn phòng"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => toggleInfoPanel(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-scale-up text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Chế Độ Văn Phòng
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold">
                  Stealth
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Luyện tai ngầm trong lúc làm việc
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleInfoPanel(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bật / Tắt & Tạm dừng Controls */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${officeModeActive ? (officeModePaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
            <span className="text-sm font-bold">
              {officeModeActive ? (officeModePaused ? 'Đang tạm dừng' : 'Đang hoạt động') : 'Đang tắt'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {officeModeActive && (
              <button
                onClick={togglePauseOfficeMode}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Alt+P"
              >
                {officeModePaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                {officeModePaused ? 'Tiếp tục' : 'Tạm dừng'}
              </button>
            )}
            <button
              onClick={() => toggleOfficeMode()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                officeModeActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
              title="Alt+Q"
            >
              {officeModeActive ? 'Tắt chế độ' : 'Bật ngay (Alt+Q)'}
            </button>
          </div>
        </div>

        {/* Thống kê phiên */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Target className="w-3 h-3" />
              Đã trả lời
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
              {officeSession.totalAnswered}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              {accuracy}% đúng
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Chuỗi đúng
            </div>
            <div className="text-lg font-black text-amber-500 mt-0.5">
              {officeSession.currentStreak}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Kỷ lục: {officeSession.bestStreak}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              XP Tích lũy
            </div>
            <div className="text-lg font-black text-brand-600 dark:text-brand-400 mt-0.5">
              +{officeSession.totalXpEarned}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {sessionMinutes} phút
            </div>
          </div>
        </div>

        {/* Thiết lập nhanh hình thức luyện */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              Hình thức luyện tập:
            </span>
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-xl">
              <button
                onClick={() => updateOfficeSettings({ mode: 'drip' })}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  officeSettings.mode === 'drip'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                💧 Nhỏ giọt
              </button>
              <button
                onClick={() => updateOfficeSettings({ mode: 'on-demand' })}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  officeSettings.mode === 'on-demand'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                ⚡ Theo yêu cầu
              </button>
            </div>
          </div>

          {officeSettings.mode === 'drip' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 dark:text-slate-400">Khoảng cách mỗi câu:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5, 10].map((min) => (
                  <button
                    key={min}
                    onClick={() => updateOfficeSettings({ intervalMinutes: min })}
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs transition-colors cursor-pointer ${
                      officeSettings.intervalMinutes === min
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {min}p
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cheat sheet phím tắt */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 mb-1">
            <Keyboard className="w-3.5 h-3.5 text-brand-500" />
            Bảng phím tắt tiện ích:
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Alt+Q</kbd> Bật / Tắt</div>
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Alt+P</kbd> Tạm dừng</div>
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Alt+R</kbd> Nghe lại</div>
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Alt+N</kbd> Câu mới / Bỏ qua</div>
            <div className="col-span-2 mt-0.5 text-indigo-600 dark:text-indigo-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Alt+1..6</kbd> hoặc gõ trực tiếp phím số <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">1</kbd>..<kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">6</kbd>
            </div>
          </div>
        </div>

        {/* Nút đặt lại phiên */}
        <div className="flex justify-between items-center pt-1 text-xs">
          <button
            onClick={resetOfficeSession}
            className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Đặt lại phiên thống kê
          </button>
          <span className="text-[10px] text-slate-400 font-mono">Nhấn Esc để đóng</span>
        </div>
      </div>
    </div>
  );
};
