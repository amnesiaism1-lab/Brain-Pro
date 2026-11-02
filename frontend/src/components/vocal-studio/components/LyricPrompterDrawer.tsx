import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Clock,
  Gauge,
} from 'lucide-react';

interface LyricPrompterDrawerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  currentTimeSec?: number;
  durationSec?: number;
  className?: string;
}

interface IParsedLrcLine {
  raw: string;
  text: string;
  timeSec: number | null;
}

export const LyricPrompterDrawer: React.FC<LyricPrompterDrawerProps> = ({
  videoId,
  isOpen,
  onClose,
  isPlaying = false,
  currentTimeSec = 0,
  durationSec = 0,
  className = '',
}) => {
  const [lyricsText, setLyricsText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.0); // 0.75, 1.0, 1.5, 2.0

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

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

  // Parse lines for optional LRC timestamp prefixes: [01:23.45] or [01:23]
  const parsedLines: IParsedLrcLine[] = useMemo(() => {
    if (!lyricsText) return [];
    return lyricsText.split('\n').map((line) => {
      const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        return {
          raw: line,
          timeSec: min * 60 + sec + ms,
          text: match[4] || '',
        };
      }
      return {
        raw: line,
        timeSec: null,
        text: line,
      };
    });
  }, [lyricsText]);

  const hasTimestamps = useMemo(() => {
    return parsedLines.some((p) => p.timeSec !== null);
  }, [parsedLines]);

  // Find index of active line when lyrics contain timestamps
  const activeLineIndex = useMemo(() => {
    if (!hasTimestamps || !isPlaying) return -1;
    let foundIdx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      const lineTime = parsedLines[i].timeSec;
      if (lineTime !== null && lineTime <= currentTimeSec) {
        foundIdx = i;
      }
    }
    return foundIdx;
  }, [hasTimestamps, isPlaying, parsedLines, currentTimeSec]);

  // Auto-scroll when active line changes (timestamped mode)
  useEffect(() => {
    if (!hasTimestamps || !isAutoScroll || isEditing || activeLineIndex < 0) return;
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, hasTimestamps, isAutoScroll, isEditing]);

  // Continuous auto-scroll when lyrics do not have timestamps (plain text mode)
  useEffect(() => {
    if (hasTimestamps || !isPlaying || !isAutoScroll || isEditing || !scrollContainerRef.current) {
      return;
    }

    const intervalMs = 60;
    const pixelStep = scrollSpeed * 1.0;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += pixelStep;
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [hasTimestamps, isPlaying, isAutoScroll, isEditing, scrollSpeed]);

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <span>Sổ Tay Nhắc Lời (Teleprompter)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              {hasTimestamps ? 'Đồng bộ nhịp LRC' : 'Tự động cuộn'}
            </span>
          </h4>
        </div>

        {/* Controls: Font Size, Speed, Auto-scroll, Edit, Close */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Speed Selector (if not timestamped) */}
          {!hasTimestamps && !isEditing && (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <span className="px-1 text-slate-500 font-mono hidden sm:inline">Tốc độ:</span>
              {[0.75, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setScrollSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    scrollSpeed === spd ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}

          {/* Font Size Toggle */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'sm' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Cỡ chữ nhỏ"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'lg' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Cỡ chữ vừa"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xl')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'xl' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Cỡ chữ lớn"
            >
              A+
            </button>
          </div>

          {/* Auto-scroll toggle */}
          <button
            type="button"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
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
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition cursor-pointer"
          >
            {isEditing ? 'Xong' : 'Sửa / Dán lời'}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Đóng sổ nhắc lời"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Prompter Text or Textarea */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1" ref={scrollContainerRef}>
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Dán lời bài hát vào khung bên dưới để làm màn hình nhắc chữ:</span>
              <span className="text-[10px] text-amber-300 font-mono">Hỗ trợ cả định dạng .LRC [00:12.34]</span>
            </div>
            <textarea
              rows={12}
              value={lyricsText}
              onChange={(e) => handleSaveLyrics(e.target.value)}
              placeholder="Dán lời bài hát vào đây...&#10;&#10;Ví dụ lời thường:&#10;Từng hàng cây nghiêng bóng nắng nhẹ buông&#10;Gió mang theo câu ca êm đềm...&#10;&#10;Hoặc định dạng LRC:&#10;[00:15.20]Từng hàng cây nghiêng bóng&#10;[00:19.40]Gió mang theo câu ca"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-sky-400 font-sans resize-none leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Lưu và Bắt đầu đọc lời
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 text-center">
            {parsedLines.length > 0 ? (
              <div className={`space-y-3 text-slate-100 ${fontSizeClass}`}>
                {parsedLines.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  return (
                    <p
                      key={idx}
                      ref={isActive ? activeLineRef : null}
                      className={`transition-all duration-200 px-3 py-1 rounded-xl ${
                        isActive
                          ? 'text-amber-300 bg-amber-500/15 border border-amber-400/40 font-black shadow-lg shadow-amber-500/10 scale-105'
                          : line.text.trim() === ''
                          ? 'h-4'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {line.text || <span className="opacity-0">.</span>}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs">Chưa có lời bài hát nào</p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
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
          <span>
            {hasTimestamps
              ? '✨ Đang tự động theo dõi và highlight dòng hát theo thời gian'
              : '💡 Chữ sẽ tự động cuộn nhịp nhàng khi nhạc phát'}
          </span>
          <button
            type="button"
            onClick={() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            }}
            className="flex items-center gap-1 text-sky-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Cuộn về đầu</span>
          </button>
        </div>
      )}
    </div>
  );
};
