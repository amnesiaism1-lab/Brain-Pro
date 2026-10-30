import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Volume2, VolumeX, Moon, Sun, Globe, Sparkles, Info, EyeOff } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    darkMode, 
    setDarkMode, 
    autoDifficulty, 
    setAutoDifficulty,
    autoHintEnabled,
    setAutoHintEnabled,
    language,
    setLanguage,
    playSound 
  } = useAppStore();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-28">
      <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">Cấu Hình Trải Nghiệm</h3>

        {/* Sound toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Hiệu ứng âm thanh</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Phản hồi âm thanh khi nhấp và hoàn thành</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Bật hoặc tắt hiệu ứng âm thanh"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound('click');
            }}
            className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                soundEnabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Dark Mode toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Chế độ ban đêm (Dark Mode)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Bảo vệ mắt khi luyện đọc ban đêm</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={darkMode}
            aria-label="Bật hoặc tắt chế độ ban đêm"
            onClick={() => {
              playSound('click');
              setDarkMode(!darkMode);
            }}
            className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
              darkMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                darkMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto difficulty default */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Thích ứng độ khó động (DDA)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tự động tăng cấp khi đạt chính xác 100% (1 phiên) hoặc ≥90% (2 phiên liên tiếp)</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={autoDifficulty}
            aria-label="Bật hoặc tắt thích ứng độ khó động DDA"
            onClick={() => {
              playSound('click');
              setAutoDifficulty(!autoDifficulty);
            }}
            className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
              autoDifficulty ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                autoDifficulty ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto-hint toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Tự động gợi ý khi dừng lâu (Auto-Hint)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tự động phát hiện và viền sáng ô tiếp theo khi người dùng dừng lại tìm kiếm. Tắt đi để tập trung tối đa tự tìm.</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={autoHintEnabled}
            aria-label="Bật hoặc tắt tự động gợi ý khi dừng lâu"
            onClick={() => {
              playSound('click');
              setAutoHintEnabled(!autoHintEnabled);
            }}
            className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
              autoHintEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                autoHintEnabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Interactive Language selector */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Ngôn ngữ hiển thị</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Tiếng Việt (Giao diện chuẩn)' : 'Tiếng Việt (Bản English đang hoàn thiện)'}
              </span>
            </div>
          </div>
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600">
            <button
              onClick={() => {
                playSound('click');
                setLanguage('vi');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-brand-600 text-white shadow-sm cursor-pointer"
            >
              Tiếng Việt
            </button>
            <button
              onClick={() => {
                playSound('click');
              }}
              title="Giao diện tiếng Anh toàn diện đang được biên dịch bản địa hóa (Sắp ra mắt)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer flex items-center gap-1.5"
            >
              <span>English</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">Sắp có</span>
            </button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="p-4 rounded-3xl bg-[#F5EFE6]/80 dark:bg-slate-800/50 border border-[#D5CBB9] dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600" />
          <span>Brain Exercises Pro v1.0.0</span>
        </div>
        <span className="font-bold text-brand-600">Vercel Ready</span>
      </div>
    </div>
  );
};
