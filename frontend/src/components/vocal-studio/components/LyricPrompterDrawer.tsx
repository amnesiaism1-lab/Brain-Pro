import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Type,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface LyricPrompterDrawerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  className?: string;
}

export const LyricPrompterDrawer: React.FC<LyricPrompterDrawerProps> = ({
  videoId,
  isOpen,
  onClose,
  isPlaying,
  className = '',
}) => {
  const [lyricsText, setLyricsText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load saved lyrics for this video ID
  useEffect(() => {
    if (!videoId) return;
    try {
      const saved = localStorage.getItem(`be_yt_lyrics_${videoId}`);
      if (saved) {
        setLyricsText(saved);
        setIsEditing(false);
      } else {
        setLyricsText('');
        setIsEditing(true);
      }
    } catch {
      // Ignored
    }
  }, [videoId]);

  // Save lyrics
  const handleSaveLyrics = (text: string) => {
    setLyricsText(text);
    try {
      localStorage.setItem(`be_yt_lyrics_${videoId}`, text);
    } catch {
      // Ignored
    }
  };

  // Smooth auto-scroll while playing
  useEffect(() => {
    if (!isPlaying || !isAutoScroll || isEditing || !scrollContainerRef.current) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += 1;
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying, isAutoScroll, isEditing]);

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-loose',
    lg: 'text-lg sm:text-xl leading-loose font-bold',
    xl: 'text-xl sm:text-2xl leading-loose font-black',
  }[fontSize];

  if (!isOpen) return null;

  return (
    <div className={`p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-col max-h-[70vh] sm:max-h-[80vh] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <span>Sổ Tay Nhắc Lời (Teleprompter)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              Hỗ trợ đọc lời
            </span>
          </h4>
        </div>

        {/* Controls: Font Size, Auto-scroll, Edit, Close */}
        <div className="flex items-center gap-1.5">
          {/* Font Size Toggle */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'sm' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'lg' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xl')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'xl' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              A+
            </button>
          </div>

          {/* Auto-scroll toggle */}
          <button
            type="button"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
              isAutoScroll ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}
            title={isAutoScroll ? 'Đang bật tự động cuộn chữ' : 'Bật tự động cuộn chữ'}
          >
            <span>Cuộn tự động</span>
          </button>

          {/* Edit / View Mode */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition"
          >
            {isEditing ? 'Xong' : 'Sửa / Dán lời'}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Prompter Text or Textarea */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1" ref={scrollContainerRef}>
        {isEditing ? (
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 block">
              Dán lời bài hát vào khung bên dưới để làm màn hình nhắc chữ khi thu âm:
            </span>
            <textarea
              rows={12}
              value={lyricsText}
              onChange={(e) => handleSaveLyrics(e.target.value)}
              placeholder="Dán lời bài hát vào đây...&#10;&#10;Ví dụ:&#10;Từng hàng cây nghiêng bóng nắng nhẹ buông&#10;Gió mang theo câu ca êm đềm..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-sky-400 font-sans resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
              >
                Lưu và Bắt đầu đọc lời
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 text-center">
            {lyricsText ? (
              <div className={`space-y-4 text-slate-100 ${fontSizeClass}`}>
                {lyricsText.split('\n').map((line, idx) => (
                  <p
                    key={idx}
                    className={`transition-colors hover:text-amber-300 ${
                      line.trim() === '' ? 'h-4' : ''
                    }`}
                  >
                    {line || <span className="opacity-0">.</span>}
                  </p>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs">Chưa có lời bài hát nào</p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Dán lời bài hát ngay
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer tips */}
      {!isEditing && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>💡 Chữ sẽ tự động cuộn nhịp nhàng khi nhạc phát</span>
          <button
            type="button"
            onClick={() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            }}
            className="flex items-center gap-1 text-sky-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Cuộn về đầu</span>
          </button>
        </div>
      )}
    </div>
  );
};
