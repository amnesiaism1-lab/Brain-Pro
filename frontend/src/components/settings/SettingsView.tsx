import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Volume2, VolumeX, Moon, Sun, Globe, Sparkles, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    darkMode, 
    setDarkMode, 
    autoDifficulty, 
    setAutoDifficulty,
    playSound 
  } = useAppStore();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-28">
      <div className="bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">Cấu Hình Trải Nghiệm</h3>

        {/* Sound toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Hiệu ứng âm thanh</span>
              <span className="text-xs text-slate-500">Phản hồi âm thanh khi nhấp và hoàn thành</span>
            </div>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound('click');
            }}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                soundEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Dark Mode toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Chế độ ban đêm (Dark Mode)</span>
              <span className="text-xs text-slate-500">Bảo vệ mắt khi luyện đọc ban đêm</span>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              setDarkMode(!darkMode);
            }}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              darkMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                darkMode ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Auto difficulty default */}
        <div className="flex items-center justify-between py-2 border-b border-[#D5CBB9]/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Thích ứng độ khó động (DDA)</span>
              <span className="text-xs text-slate-500">Tự động tăng cấp khi đạt chính xác trên 90%</span>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              setAutoDifficulty(!autoDifficulty);
            }}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              autoDifficulty ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                autoDifficulty ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block">Ngôn ngữ hiển thị</span>
              <span className="text-xs text-slate-500">Tiếng Việt (Mặc định)</span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            Tiếng Việt
          </span>
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
