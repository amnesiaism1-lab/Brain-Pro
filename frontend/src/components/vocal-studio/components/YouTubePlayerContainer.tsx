import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  diagnoseYouTubeError,
  loadYouTubeIframeAPI,
  IYouTubeErrorInfo,
} from '../../../services/youtubeBeatService';

interface YouTubePlayerContainerProps {
  videoId: string;
  onPlayerReady?: (player: any) => void;
  onStateChange?: (state: number) => void;
  onError?: (errInfo: IYouTubeErrorInfo) => void;
  className?: string;
  isCustomPlaying?: boolean;
  onTogglePlay?: () => void;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: () => void;
  hidePlayButtonOverlay?: boolean;
  children?: React.ReactNode;
}

export const YouTubePlayerContainer: React.FC<YouTubePlayerContainerProps> = ({
  videoId,
  onPlayerReady,
  onStateChange,
  onError,
  className = '',
  isCustomPlaying,
  onTogglePlay,
  isTheaterMode = false,
  onToggleTheaterMode,
  hidePlayButtonOverlay = false,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<IYouTubeErrorInfo | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadYouTubeIframeAPI()
      .then(() => {
        if (isMounted) setIsApiReady(true);
      })
      .catch((err) => {
        if (isMounted) {
          const diag = diagnoseYouTubeError(5);
          setErrorInfo(diag);
          setIsLoading(false);
          onError?.(diag);
        }
      });

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignored
        }
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isApiReady || !videoId) return;

    setErrorInfo(null);
    setIsLoading(true);

    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // Ignored
      }
      playerRef.current = null;
    }

    try {
      playerRef.current = new window.YT.Player(playerIdRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // CRITICAL: Disable native YouTube controls to prevent desync!
          disablekb: 1, // Disable keyboard shortcuts
          modestbranding: 1,
          rel: 0,
          fs: 0,
          playsinline: 1, // Critical for iOS Safari
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsLoading(false);
            onPlayerReady?.(event.target);
          },
          onStateChange: (event: any) => {
            onStateChange?.(event.data);
          },
          onError: (event: any) => {
            setIsLoading(false);
            const diag = diagnoseYouTubeError(event.data);
            setErrorInfo(diag);
            onError?.(diag);
          },
        },
      });
    } catch (e) {
      console.warn('Failed to construct YT.Player:', e);
      setIsLoading(false);
    }
  }, [isApiReady, videoId]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl group ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full aspect-video">
        <div id={playerIdRef.current} className="w-full h-full pointer-events-none" />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-300">
              Đang tải beat từ YouTube...
            </span>
          </div>
        )}

        {/* Error 101/150 or General Error Overlay */}
        {errorInfo && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{errorInfo.title}</h4>
            <p className="text-xs text-slate-300 max-w-md mb-2">{errorInfo.message}</p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] text-left max-w-md mb-4 flex items-start gap-2">
              <span className="font-bold shrink-0">💡 Gợi ý:</span>
              <span>{errorInfo.actionHint}</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trực tiếp trên YouTube</span>
            </a>
          </div>
        )}

        {/* Custom Play/Pause Overlay Hitbox (hidden if hidePlayButtonOverlay is true, e.g. during active recording) */}
        {!errorInfo && !isLoading && onTogglePlay && !hidePlayButtonOverlay && (
          <button
            type="button"
            onClick={onTogglePlay}
            className="absolute inset-0 bg-black/20 hover:bg-black/30 transition flex items-center justify-center group/btn cursor-pointer"
            title={isCustomPlaying ? 'Tạm dừng Beat' : 'Phát Beat'}
          >
            <div className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform group-hover/btn:scale-110">
              {isCustomPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* Custom Children Overlay (e.g. Countdown or Live Recording HUD) */}
        {children}
      </div>

      {/* Discreet Bottom Bar Notice with Theater Mode Switch */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-medium text-slate-300 truncate">
            YouTube Backing Track ({videoId})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheaterMode && (
            <button
              type="button"
              onClick={onToggleTheaterMode}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
              title={isTheaterMode ? 'Thu nhỏ về chế độ 2 cột' : 'Phóng to chế độ Sân khấu Karaoke'}
            >
              {isTheaterMode ? (
                <>
                  <Minimize2 className="w-3 h-3 text-sky-400" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-sky-400" />
                  <span>Sân khấu to</span>
                </>
              )}
            </button>
          )}

          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Controls = App Managed
          </span>
        </div>
      </div>
    </div>
  );
};
