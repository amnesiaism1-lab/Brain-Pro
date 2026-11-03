import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PitchRecallInputRule, RULE_INFO_MAP } from '../../services/pitchRecallKeyMap';
import {
  Headphones,
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Zap,
  Target,
  Keyboard,
  Sliders,
  Sparkles,
  BookOpen,
  Music2,
  ShieldAlert,
  ArrowRight,
  Bell,
  HelpCircle
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

  const [activeSubTab, setActiveSubTab] = useState<'controls' | 'guide'>('controls');

  if (!isInfoPanelOpen) return null;

  const sessionMinutes = Math.floor((Date.now() - officeSession.startedAt) / 60000);
  const accuracy = officeSession.totalAnswered > 0
    ? Math.round((officeSession.correctCount / officeSession.totalAnswered) * 100)
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bảng điều khiển và Hướng dẫn Chế độ Văn phòng"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => toggleInfoPanel(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-scale-up text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Chế Độ Văn Phòng (Stealth Ear Training)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  Phím Tắt
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Luyện tai ngầm trong lúc làm việc — không cần chuyển tab hay nhìn màn hình
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

        {/* Tab Navigation: Bảng Điều Khiển vs Hướng Dẫn Sử Dụng */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setActiveSubTab('controls')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'controls'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bảng Điều Khiển & Thống Kê</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'guide'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hướng Dẫn Sử Dụng Chi Tiết</span>
          </button>
        </div>

        {/* TAB 1: BẢNG ĐIỀU KHIỂN & THỐNG KÊ */}
        {activeSubTab === 'controls' ? (
          <div className="space-y-4">
            {/* Bật / Tắt & Tạm dừng Controls */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${officeModeActive ? (officeModePaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
                <span className="text-sm font-bold">
                  {officeModeActive ? (officeModePaused ? 'Đang tạm dừng' : 'Đang hoạt động ngầm') : 'Đang tắt'}
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
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title="Alt+Q"
                >
                  {officeModeActive ? 'Tắt chế độ' : 'Bật ngay (Alt+Q)'}
                </button>
              </div>
            </div>

            {/* Chọn bài tập luyện ngầm: Nhớ Cao Độ vs Nhận Diện Quãng */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs gap-2">
              <span className="font-bold flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-indigo-500" />
                Bài tập luyện ngầm:
              </span>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-xl">
                <button
                  onClick={() => updateOfficeSettings({ exerciseSlug: 'pitch-recall' })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    officeSettings.exerciseSlug === 'pitch-recall'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  🎵 Nhớ Cao Độ
                </button>
                <button
                  onClick={() => updateOfficeSettings({ exerciseSlug: 'interval-identify' })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    officeSettings.exerciseSlug === 'interval-identify'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  🎹 Nhận Diện Quãng
                </button>
              </div>
            </div>

            {/* Quy tắc bàn phím cho Nhớ Cao Độ */}
            {officeSettings.exerciseSlug === 'pitch-recall' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                    Quy tắc bàn phím:
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                    {RULE_INFO_MAP[officeSettings.pitchRecallInputRule || 'scale-degrees']?.hotkeyGuide}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(['scale-degrees', 'piano-keys', 'note-letters', 'multiple-choice'] as PitchRecallInputRule[]).map((ruleKey) => {
                    const info = RULE_INFO_MAP[ruleKey];
                    const isSelected = (officeSettings.pitchRecallInputRule || 'scale-degrees') === ruleKey;
                    return (
                      <button
                        key={ruleKey}
                        onClick={() => updateOfficeSettings({ pitchRecallInputRule: ruleKey })}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-xs">
                          <span>{info.icon}</span>
                          <span className="truncate">{info.shortName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {info.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Hình thức phát câu hỏi:
                </span>
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-xl">
                  <button
                    onClick={() => updateOfficeSettings({ mode: 'drip' })}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      officeSettings.mode === 'drip'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    💧 Nhỏ giọt
                  </button>
                  <button
                    onClick={() => updateOfficeSettings({ mode: 'on-demand' })}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      officeSettings.mode === 'on-demand'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                            ? 'bg-indigo-600 text-white'
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

            {/* Quick hotkeys snippet */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs flex items-center justify-between">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                Phím tắt quan trọng:
              </span>
              <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border">Alt+Q</kbd> Bật/Tắt • <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border">Alt+R</kbd> Nghe lại • <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border">Alt+N</kbd> Câu tiếp
              </span>
            </div>

            {/* Reset button */}
            <div className="flex justify-between items-center pt-1 text-xs">
              <button
                onClick={resetOfficeSession}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại phiên thống kê
              </button>
              <button
                onClick={() => setActiveSubTab('guide')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem hướng dẫn chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: HƯỚNG DẪN SỬ DỤNG CHI TIẾT */
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
            {/* Mục 1: Triết lý */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                🎧 1. Mục đích & Triết lý
              </h4>
              <p>
                Chế độ Văn phòng (Stealth Ear Training) được thiết kế để bạn <strong>vừa làm việc (code, soạn thảo, lướt web) vừa luyện cảm âm ngầm</strong>. Toàn bộ chu trình luyện tập diễn ra qua âm thanh và phím tắt, bạn không cần phải chuyển tab trình duyệt hay nhìn vào màn hình.
              </p>
            </div>

            {/* Mục 2: Bài tập Nhớ Cao Độ & Các Quy Tắc Bàn Phím */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                🎵 2. Cách chơi bài "Nhớ Cao Độ" với Quy Tắc Bàn Phím
              </h4>
              <p>
                Khi đến giờ luyện tập, hệ thống phát chuỗi giai điệu gồm 3–5 nốt nhạc (ví dụ: <em>Đồ - Mi - Sol</em>). Bạn có thể chọn 1 trong 4 quy tắc bấm phím phù hợp với thói quen của mình:
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">🔢 Quy tắc Bậc âm 1..7 (Khuyên dùng cho văn phòng):</span>
                  <p className="text-[11px] mt-0.5">
                    Gõ lần lượt các phím số: <strong>1</strong> (Đồ), <strong>2</strong> (Rê), <strong>3</strong> (Mi), <strong>4</strong> (Fa), <strong>5</strong> (Sol), <strong>6</strong> (La), <strong>7</strong> (Si), <strong>8</strong> (Đố). Dễ gõ mù 1 tay trên hàng số hoặc Numpad mà không cần nhìn màn hình.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">🎹 Quy tắc Hàng phím Piano (A S D F G H J K):</span>
                  <p className="text-[11px] mt-0.5">
                    Mô phỏng phím đàn piano chuẩn DAW (Home row: A S D F G H J K là nốt trắng, W E T Y U là nốt đen). Thích hợp với người quen đàn phím ảo.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">🔤 Quy tắc Ký âm chữ cái (C D E F G A B):</span>
                  <p className="text-[11px] mt-0.5">
                    Gõ trực tiếp các phím chữ cái theo tên nốt nhạc quốc tế.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">📋 Quy tắc Trắc nghiệm 1..4:</span>
                  <p className="text-[11px] mt-0.5">
                    Hiển thị 4 phương án trên màn hình, bấm 1..4 để chọn phương án bạn muốn.
                  </p>
                </div>
              </div>
              <ul className="list-disc pl-4 space-y-1 pt-1 text-slate-500 dark:text-slate-400">
                <li>Bấm <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Backspace</kbd> để xóa 1 nốt vừa gõ nếu lỡ tay bấm nhầm.</li>
                <li>Bấm <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Alt+C</kbd> (hoặc <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Esc</kbd> / <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Del</kbd>) để <strong>Reset xóa sạch chuỗi nốt</strong> và làm lại từ đầu nhanh mà không cần gõ Backspace nhiều lần!</li>
                <li>Bấm <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Alt+R</kbd> để nghe lại chuỗi giai điệu nếu chưa nghe rõ.</li>
              </ul>
            </div>

            {/* Mục 3: Chế độ Freestyle khi sai */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                🎹 3. Khi trả lời sai — Chế độ Ôn tập Freestyle
              </h4>
              <p>
                Khi trả lời sai, hệ thống <strong>KHÔNG tự động biến mất</strong> sau 2 giây! Thay vào đó, viên nang sẽ chuyển sang chế độ <strong>Freestyle Review</strong> để bạn tự do học lại:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Hiển thị rõ <strong>Chuỗi bạn chọn ✗</strong> và <strong>Đáp án đúng ✓</strong>.</li>
                <li><strong>Gõ phím tự do:</strong> Bạn có thể bấm các phím <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">1</kbd>..<kbd className="px-1 bg-white dark:bg-slate-800 rounded border">4</kbd> để nghe thử từng chuỗi nốt đối chiếu (A/B testing) mà không bị phạt điểm.</li>
                <li>Bấm <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Alt+R</kbd> để nghe lại chuỗi đề bài gốc.</li>
                <li>Sau khi tai đã nghe hiểu rõ, bạn nhấn <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Alt+N</kbd> (hoặc <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Enter</kbd> / <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Space</kbd>) để chuyển tiếp sang câu kế tiếp!</li>
              </ul>
            </div>

            {/* Mục 4: Bảng phím tắt */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                ⌨️ 4. Bảng phím tắt toàn năng
              </h4>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+Q</span>: Bật / Tắt chế độ</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+P</span>: Tạm dừng / Tiếp tục</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+R</span>: Nghe lại âm thanh</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+C</span>: Reset xóa chuỗi gõ lại</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+N</span>: Câu tiếp / Bỏ qua</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+1..8</span>: Bấm nốt / Chọn</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Alt+I</span>: Bảng điều khiển</div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Esc / Del</span>: Reset chuỗi nốt</div>
              </div>
            </div>

            {/* Mục 5: Giải pháp khi ở tab khác / ứng dụng khác */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                5. Khi ở tab khác hoặc app khác thì làm sao để bấm?
              </h4>
              <p>
                <strong>Về mặt kỹ thuật:</strong> Các trình duyệt (Chrome, Edge) ngăn chặn các trang web đọc phím bấm khi bạn đang ở tab khác hoặc app khác (để bảo vệ an toàn thông tin, tránh website độc hại theo dõi bàn phím khi gõ mật khẩu). Do đó, khi bạn đang gõ trong Word/Excel/VS Code, phím gõ sẽ gửi vào ứng dụng đó chứ web không tự cướp tiêu điểm được.
              </p>
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    💡 Giải pháp 1: Bấm qua Thông báo Desktop (Windows Toast)
                  </span>
                  <span>Khi tab đang chạy ngầm phát câu hỏi, một thông báo Windows Toast xuất hiện ở góc màn hình. Bạn chỉ cần <strong>click vào thông báo</strong> là tab được đưa lên hàng đầu ngay lập tức để bạn gõ số <kbd className="px-1 bg-slate-100 dark:bg-slate-700 rounded border">1</kbd>..<kbd className="px-1 bg-slate-100 dark:bg-slate-700 rounded border">4</kbd>!</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    🎧 Giải pháp 2: Điều khiển bằng nút tai nghe Bluetooth / Media Key
                  </span>
                  <span>Dù tab đang ở nền hay bị thu nhỏ, bạn vẫn có thể bấm nút đa phương tiện trên bàn phím hoặc nút bấm tai nghe: bấm nghe lại (<kbd>Alt+R</kbd>) hoặc bấm Next Track để sang câu kế tiếp (<kbd>Alt+N</kbd>).</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    🪟 Giải pháp 3: Chia đôi màn hình hoặc mở cửa sổ riêng
                  </span>
                  <span>Mở Brain Pro trong một cửa sổ riêng nhỏ ở góc màn hình (Snap Window sang góc phải). Khi nghe thấy tiếng đàn, bạn chỉ cần click một click hoặc gõ phím số mà không cần mất công tìm tab giữa hàng chục tab đang mở!</span>
                </div>
              </div>
            </div>

            {/* Mục 6: Tính năng chống ngắt quãng */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
                Cơ chế chống ngắt mạch công việc:
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Khi bạn đang gõ code hoặc văn bản liên tục (≥ 3 phím trong 2 giây), hệ thống tự động dời câu hỏi lại 15 giây. Khi bạn dừng tay suy nghĩ, âm thanh mới nhẹ nhàng phát ra.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
