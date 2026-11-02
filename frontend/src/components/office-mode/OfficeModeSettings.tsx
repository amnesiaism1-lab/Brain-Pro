import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PitchRecallInputRule, RULE_INFO_MAP } from '../../services/pitchRecallKeyMap';
import {
  Headphones,
  Sliders,
  Volume2,
  Clock,
  Keyboard,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Music2,
  Bell
} from 'lucide-react';

export const OfficeModeSettings: React.FC = () => {
  const {
    officeModeActive,
    toggleOfficeMode,
    officeSettings,
    updateOfficeSettings,
    playSound
  } = useAppStore();

  return (
    <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              Chế Độ Văn Phòng (Stealth Ear Training)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                Mới
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Luyện nghe cao độ ngầm trong lúc làm việc bằng phím tắt, không cần chuyển tab hay nhìn màn hình
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <button
          role="switch"
          aria-checked={officeModeActive}
          aria-label="Bật hoặc tắt Chế độ Văn phòng"
          onClick={() => {
            playSound('click');
            toggleOfficeMode();
          }}
          className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
            officeModeActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          title="Phím tắt: Alt+Q"
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              officeModeActive ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="space-y-4 pt-2">
        {/* Chọn bài tập luyện ngầm: Nhớ Cao Độ vs Nhận Diện Quãng */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700 gap-2">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Bài tập luyện ngầm</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Chọn nội dung bài tập rèn luyện thính giác khi ngồi làm việc
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700/60 p-1 rounded-2xl">
            <button
              onClick={() => updateOfficeSettings({ exerciseSlug: 'pitch-recall' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                officeSettings.exerciseSlug === 'pitch-recall'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              🎵 Nhớ Cao Độ
            </button>
            <button
              onClick={() => updateOfficeSettings({ exerciseSlug: 'interval-identify' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                officeSettings.exerciseSlug === 'interval-identify'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              🎹 Nhận Diện Quãng
            </button>
          </div>
        </div>

        {/* Quy tắc bấm bàn phím cho Nhớ Cao Độ */}
        {officeSettings.exerciseSlug === 'pitch-recall' && (
          <div className="py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-indigo-500" />
                  Quy tắc bấm cao độ trên bàn phím
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn cách ánh xạ phím gõ nốt nhạc khi luyện bài Nhớ Cao Độ ở chế độ ngầm
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['scale-degrees', 'piano-keys', 'note-letters', 'multiple-choice'] as PitchRecallInputRule[]).map((ruleKey) => {
                const info = RULE_INFO_MAP[ruleKey];
                const isSelected = (officeSettings.pitchRecallInputRule || 'scale-degrees') === ruleKey;
                return (
                  <button
                    key={ruleKey}
                    type="button"
                    onClick={() => updateOfficeSettings({ pitchRecallInputRule: ruleKey })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-white/60 dark:bg-slate-750 border-slate-200 dark:border-slate-700/80 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>{info.icon}</span>
                        <span>{info.name}</span>
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-1.5">
                      {info.desc}
                    </p>
                    <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-900/50 truncate">
                      {info.hotkeyGuide}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hình thức luyện tập: Nhỏ giọt vs Theo yêu cầu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700 gap-2">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Hình thức luyện tập</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {officeSettings.mode === 'drip'
                ? 'Tự động phát câu hỏi cách quãng đều đặn'
                : 'Chỉ phát câu hỏi khi bạn bấm phím Alt+N'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 p-1 rounded-2xl">
            <button
              onClick={() => updateOfficeSettings({ mode: 'drip' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                officeSettings.mode === 'drip'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              💧 Nhỏ giọt (Drip)
            </button>
            <button
              onClick={() => updateOfficeSettings({ mode: 'on-demand' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                officeSettings.mode === 'on-demand'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              ⚡ Theo yêu cầu
            </button>
          </div>
        </div>

        {/* Khoảng cách câu hỏi (chỉ khi ở mode drip) */}
        {officeSettings.mode === 'drip' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700 gap-2">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Khoảng cách giữa các câu</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tần suất phát câu hỏi tự động (mặc định 3 phút)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 5, 10].map((min) => (
                <button
                  key={min}
                  onClick={() => updateOfficeSettings({ intervalMinutes: min })}
                  className={`px-3 py-1 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer ${
                    officeSettings.intervalMinutes === min
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {min} phút
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thông báo Desktop khi tab ở background */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-500" />
              Thông báo Desktop (Windows Toast)
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Đẩy thông báo ra góc màn hình khi phát câu hỏi lúc bạn đang ở tab khác hoặc ứng dụng khác
            </span>
          </div>
          <button
            role="switch"
            aria-checked={officeSettings.enableNotifications}
            onClick={() => {
              if (!officeSettings.enableNotifications && typeof Notification !== 'undefined') {
                Notification.requestPermission();
              }
              updateOfficeSettings({ enableNotifications: !officeSettings.enableNotifications });
            }}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              officeSettings.enableNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                officeSettings.enableNotifications ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Âm lượng câu hỏi riêng */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700 gap-2">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Âm lượng câu hỏi</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Độ lớn âm thanh nốt nhạc khi làm việc: {Math.round(officeSettings.volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-48">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={officeSettings.volume}
              onChange={(e) => updateOfficeSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 w-8 text-right">
              {Math.round(officeSettings.volume * 100)}%
            </span>
          </div>
        </div>

        {/* Trì hoãn thông minh khi đang gõ phím */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Tránh làm phiền khi đang gõ phím</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Tự động hoãn 15 giây nếu phát hiện bạn đang liên tục gõ code hoặc văn bản
            </span>
          </div>
          <button
            role="switch"
            aria-checked={officeSettings.delayWhenTyping}
            onClick={() => updateOfficeSettings({ delayWhenTyping: !officeSettings.delayWhenTyping })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              officeSettings.delayWhenTyping ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                officeSettings.delayWhenTyping ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tự động phát lại đáp án đúng khi trả lời sai */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Tự động phát lại đáp án đúng</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Khi bấm sai, hệ thống sẽ phát lại ngay âm thanh giai điệu chuẩn để tai bạn học lại
            </span>
          </div>
          <button
            role="switch"
            aria-checked={officeSettings.autoReplayOnWrong}
            onClick={() => updateOfficeSettings({ autoReplayOnWrong: !officeSettings.autoReplayOnWrong })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              officeSettings.autoReplayOnWrong ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                officeSettings.autoReplayOnWrong ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Hiển thị viên nang nổi */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">Hiển thị thanh nổi (Pill)</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Hiện viên nang nhỏ ở góc màn hình để theo dõi tiến độ và bấm chọn
            </span>
          </div>
          <button
            role="switch"
            aria-checked={officeSettings.showPill}
            onClick={() => updateOfficeSettings({ showPill: !officeSettings.showPill })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              officeSettings.showPill ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                officeSettings.showPill ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Vị trí viên nang */}
        {officeSettings.showPill && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-2">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Vị trí hiển thị</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Góc neo của viên nang trên màn hình
              </span>
            </div>
            <select
              value={officeSettings.pillPosition}
              onChange={(e) => updateOfficeSettings({ pillPosition: e.target.value as any })}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-[#D5CBB9] dark:border-slate-600 text-xs font-bold cursor-pointer"
            >
              <option value="bottom-right">Góc dưới - Phải (Mặc định)</option>
              <option value="bottom-left">Góc dưới - Trái</option>
              <option value="top-right">Góc trên - Phải</option>
              <option value="top-left">Góc trên - Trái</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
