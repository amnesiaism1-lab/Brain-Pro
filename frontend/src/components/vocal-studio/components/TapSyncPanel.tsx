import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Check, Hand, Gauge } from 'lucide-react';
import { auditoryEngine } from '../../../services/auditoryEngine';
import { formatTimeMs } from '../utils/vocalHelpers';

interface TapSyncPanelProps {
  audioBuffer?: AudioBuffer;
  initialLyricsText: string;
  onCompleteEnhancedLrc: (enhancedLrcText: string) => void;
}

interface ITapWordItem {
  lineIdx: number;
  wordIdx: number;
  text: string;
  stampedMs?: number;
}

function formatLrcTimestamp(ms: number): string {
  const safe = Math.max(0, Math.round(ms));
  const min = Math.floor(safe / 60000);
  const sec = Math.floor((safe % 60000) / 1000);
  const cs = Math.floor((safe % 1000) / 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export const TapSyncPanel: React.FC<TapSyncPanelProps> = ({
  audioBuffer,
  initialLyricsText,
  onCompleteEnhancedLrc,
}) => {
  const [rawText, setRawText] = useState(initialLyricsText);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(0.85);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const [stamps, setStamps] = useState<Record<number, number>>({});

  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedCtxTimeRef = useRef<number>(0);
  const startedOffsetMsRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const lines = useMemo(
    () =>
      rawText
        .split(/\r?\n/)
        .map((l) => l.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, '').replace(/<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g, '').trim())
        .filter(Boolean),
    [rawText]
  );

  const flatWords: ITapWordItem[] = useMemo(() => {
    const out: ITapWordItem[] = [];
    lines.forEach((line, lineIdx) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      tokens.forEach((tk, wordIdx) => {
        out.push({ lineIdx, wordIdx, text: tk });
      });
    });
    return out;
  }, [lines]);

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const getLiveTimeMs = useCallback(() => {
    if (!isPlaying) return currentTimeMs;
    const ctx = auditoryEngine.initContext();
    if (!ctx) return currentTimeMs;
    const elapsedRealMs = (ctx.currentTime - startedCtxTimeRef.current) * 1000 * playbackRate;
    return Math.min(
      audioBuffer ? audioBuffer.duration * 1000 : 999999,
      startedOffsetMsRef.current + Math.max(0, elapsedRealMs)
    );
  }, [isPlaying, currentTimeMs, playbackRate, audioBuffer]);

  const startPlayback = useCallback(
    (fromMs: number) => {
      if (!audioBuffer) return;
      stopAudio();
      const ctx = auditoryEngine.initContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      const offsetSec = Math.max(0, Math.min(audioBuffer.duration - 0.05, fromMs / 1000));
      source.start(0, offsetSec);

      sourceRef.current = source;
      startedCtxTimeRef.current = ctx.currentTime;
      startedOffsetMsRef.current = fromMs;
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
      };

      const tick = () => {
        const nowElapsed = (ctx.currentTime - startedCtxTimeRef.current) * 1000 * playbackRate;
        setCurrentTimeMs(startedOffsetMsRef.current + Math.max(0, nowElapsed));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [audioBuffer, playbackRate, stopAudio]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      const cur = getLiveTimeMs();
      stopAudio();
      setCurrentTimeMs(cur);
    } else {
      startPlayback(currentTimeMs);
    }
  }, [isPlaying, getLiveTimeMs, stopAudio, startPlayback, currentTimeMs]);

  const handleTapWord = useCallback(() => {
    if (cursorIndex >= flatWords.length) return;
    const nowMs = Math.round(getLiveTimeMs());
    setStamps((prev) => ({ ...prev, [cursorIndex]: nowMs }));
    setCursorIndex((idx) => Math.min(flatWords.length, idx + 1));
  }, [cursorIndex, flatWords.length, getLiveTimeMs]);

  const handleUndoTap = useCallback(() => {
    if (cursorIndex <= 0) return;
    const prevIdx = cursorIndex - 1;
    setCursorIndex(prevIdx);
    const targetMs = stamps[prevIdx];
    if (targetMs !== undefined) {
      const rewindMs = Math.max(0, targetMs - 1500);
      setCurrentTimeMs(rewindMs);
      if (isPlaying) startPlayback(rewindMs);
    }
  }, [cursorIndex, stamps, isPlaying, startPlayback]);

  // Keyboard listener for Spacebar tap & Backspace undo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTapWord();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        handleUndoTap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTapWord, handleUndoTap]);

  const handleExportAndApply = () => {
    stopAudio();
    const lrcLines: string[] = [];
    let globalWordIdx = 0;

    lines.forEach((line) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return;
      const lineStartMs = stamps[globalWordIdx] ?? 0;
      const wordParts = tokens.map((tk) => {
        const wMs = stamps[globalWordIdx] ?? lineStartMs;
        globalWordIdx++;
        return `<${formatLrcTimestamp(wMs)}>${tk}`;
      });
      lrcLines.push(`[${formatLrcTimestamp(lineStartMs)}] ${wordParts.join(' ')}`);
    });

    onCompleteEnhancedLrc(lrcLines.join('\n'));
  };

  const stampedCount = Object.keys(stamps).length;

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-sky-300">Chế độ Gõ Nhịp Chuẩn Từng Chữ (Tap-to-Sync):</strong> Dán lời bên dưới, bấm Phát nhạc và gõ phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Space</kbd> đúng lúc ca sĩ cất từng chữ (hoặc <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Backspace</kbd> để lùi lại).
        </div>
      </div>

      {/* Audio Transport & Speed Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!audioBuffer}
            onClick={togglePlay}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Tạm dừng' : 'Phát nhạc để gõ'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAudio();
              setCurrentTimeMs(0);
              setCursorIndex(0);
              setStamps({});
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>

          <span className="font-mono text-xs text-sky-400 font-bold px-2">
            {formatTimeMs(currentTimeMs)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Tốc độ:</span>
          {[0.75, 0.85, 1.0].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => {
                setPlaybackRate(spd);
                if (isPlaying) startPlayback(getLiveTimeMs());
              }}
              className={`px-2 py-1 rounded-lg font-mono font-bold text-[11px] transition cursor-pointer ${
                playbackRate === spd
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Live Highlighted Words Grid + Big Tap Button */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lời bài hát (mỗi dòng 1 câu)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setCursorIndex(0);
              setStamps({});
            }}
            rows={7}
            placeholder="Dán lời bài hát thô vào đây..."
            className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              Tiến độ khớp: <span className="text-emerald-400">{stampedCount}/{flatWords.length}</span> từ
            </span>
            {cursorIndex < flatWords.length && (
              <span className="text-[11px] text-amber-300 font-mono">
                Từ tiếp theo: &quot;{flatWords[cursorIndex].text}&quot;
              </span>
            )}
          </div>

          <div className="flex-1 max-h-36 overflow-y-auto flex flex-wrap gap-1.5 content-start p-2 rounded-xl bg-slate-900/70 border border-slate-800/80">
            {flatWords.map((w, idx) => {
              const isDone = stamps[idx] !== undefined;
              const isCurrent = idx === cursorIndex;
              return (
                <button
                  key={`${w.lineIdx}-${w.wordIdx}-${idx}`}
                  type="button"
                  onClick={() => setCursorIndex(idx)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isCurrent
                      ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-300 scale-105'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {w.text}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTapWord}
              disabled={cursorIndex >= flatWords.length}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              <Hand className="w-4 h-4" />
              <span>CHẠM GÕ NHỊP TỪ TIẾP THEO (SPACE)</span>
            </button>

            <button
              type="button"
              onClick={handleExportAndApply}
              disabled={stampedCount === 0}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Khớp Vào Cao Độ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
