import React from 'react';
import { AppWindow, Maximize2, Headphones, Sparkles } from 'lucide-react';
import { useVocalStudioStore } from '../../../store/vocalStudioStore';

interface OfficePopUpLauncherProps {
  size?: 'sm' | 'md';
  showFullStudioButton?: boolean;
  className?: string;
  onPopUpOpened?: () => void;
  onStudioOpened?: () => void;
}

export const OfficePopUpLauncher: React.FC<OfficePopUpLauncherProps> = ({
  size = 'md',
  showFullStudioButton = true,
  className = '',
  onPopUpOpened,
  onStudioOpened,
}) => {
  const { openOfficePopUp, openStudio } = useVocalStudioStore();

  const handleOpenPopUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    openOfficePopUp();
    if (onPopUpOpened) onPopUpOpened();
  };

  const handleOpenStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    openStudio();
    if (onStudioOpened) onStudioOpened();
  };

  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 1. Primary Button: Spotify-style Office Pop-up Window */}
      <button
        onClick={handleOpenPopUp}
        className={`rounded-xl font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
          isSmall
            ? 'px-2.5 py-1 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/30'
            : 'px-4 py-2.5 text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/40 hover:scale-[1.02]'
        }`}
        title="Mở cửa sổ Pop-up độc lập (Picture-in-Picture) chuyên dụng cho văn phòng: Always-on-top, lọc ồn, phím Boss Key"
      >
        <AppWindow className={isSmall ? 'w-3 h-3 text-emerald-200' : 'w-4 h-4 text-emerald-200'} />
        <span>Pop-up Văn Phòng</span>
        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-400/40">
          PiP
        </span>
      </button>

      {/* 2. Secondary Button: Full Screen Studio Modal */}
      {showFullStudioButton && (
        <button
          onClick={handleOpenStudio}
          className={`rounded-xl font-semibold flex items-center gap-1.5 border border-slate-700/80 active:scale-95 transition-all cursor-pointer ${
            isSmall
              ? 'px-2 py-1 text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'px-3.5 py-2.5 text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Mở phòng thu đầy đủ toàn màn hình (Phân tích file MP3, chỉnh sửa lời, báo cáo chi tiết)"
        >
          <Maximize2 className={isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
          <span>Full Studio</span>
        </button>
      )}
    </div>
  );
};
