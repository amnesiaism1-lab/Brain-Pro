import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Link2,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Volume2,
  Mic,
  Music,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
  Download,
  Plus,
  Radio,
  Sparkles,
  ChevronRight,
  HardDrive,
  Info,
  Clock,
  Layers,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  extractYouTubeVideoId,
  extractYouTubeStartTime,
  POPULAR_BEAT_PRESETS,
  IBeatPreset,
  IYouTubeErrorInfo,
} from '../../../services/youtubeBeatService';
import { vocalRecordingEngine } from '../../../services/vocalRecordingEngine';
import {
  youtubeTakeStorageService,
  IYouTubeTake,
  IYouTubeSession,
} from '../../../services/youtubeTakeStorageService';
import { youtubeSyncMixer } from '../../../services/youtubeSyncMixer';
import { YouTubePlayerContainer } from '../components/YouTubePlayerContainer';
import { MicPreflightCheck } from '../components/MicPreflightCheck';
import { VocalWaveformTrack } from '../components/VocalWaveformTrack';
import { TakeManagerList } from '../components/TakeManagerList';
import { ExportMixModal } from '../components/ExportMixModal';
import { LyricPrompterDrawer } from '../components/LyricPrompterDrawer';
import { formatTimeMs } from '../utils/vocalHelpers';

export type YouTubeStudioStep = 'choose_beat' | 'prepare' | 'recording' | 'review_mix';

export const YouTubeBeatTab: React.FC = () => {
  // Step workflow
  const [currentStep, setCurrentStep] = useState<YouTubeStudioStep>('choose_beat');

  // Step 1: Beat selection
  const [urlInput, setUrlInput] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string>('vB6gQo5v_6g'); // default sample acoustic
  const [videoTitle, setVideoTitle] = useState<string>('Acoustic Guitar Pop Beat');
  const [ytPlayerInstance, setYtPlayerInstance] = useState<any>(null);
  const [playerError, setPlayerError] = useState<IYouTubeErrorInfo | null>(null);

  // Step 2: Prepare & Settings
  const [isMicReady, setIsMicReady] = useState(false);
  const [startPointSec, setStartPointSec] = useState<number>(8);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number>(3);

  // Step 3: Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDurationSec, setRecordDurationSec] = useState(0);
  const [liveVuRms, setLiveVuRms] = useState(0);
  const [liveVuDb, setLiveVuDb] = useState(-80);
  const recordingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Step 4: Playback, Mix & Takes
  const [session, setSession] = useState<IYouTubeSession | null>(null);
  const [takes, setTakes] = useState<IYouTubeTake[]>([]);
  const [activeTake, setActiveTake] = useState<IYouTubeTake | null>(null);

  // Audio Mix Controls
  const [isPlayingMix, setIsPlayingMix] = useState(false);
  const [beatCurrentTimeSec, setBeatCurrentTimeSec] = useState(0);
  const [beatDurationSec, setBeatDurationSec] = useState(0);
  const [beatVolume, setBeatVolume] = useState(0.8);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [nudgeOffsetMs, setNudgeOffsetMs] = useState(0);
  const [isReverb, setIsReverb] = useState(false);
  const [isCompressor, setIsCompressor] = useState(true);

  // Storage, Prompter and Modals
  const [storageEstimateMb, setStorageEstimateMb] = useState<number | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isLyricPrompterOpen, setIsLyricPrompterOpen] = useState(false);

  // Initialize or fetch session for video ID
  const initSession = useCallback(async (vidId: string, title?: string) => {
    const sessionId = `yt-session-${vidId}`;
    let sess = await youtubeTakeStorageService.getSession(sessionId);
    if (!sess) {
      sess = {
        id: sessionId,
        videoId: vidId,
        videoTitle: title || 'YouTube Backing Track',
        startPointSec: 0,
        nudgeOffsetMs: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await youtubeTakeStorageService.saveSession(sess);
    }
    setSession(sess);
    setStartPointSec(sess.startPointSec || 0);
    setNudgeOffsetMs(sess.nudgeOffsetMs || 0);

    const loadedTakes = await youtubeTakeStorageService.getTakesForSession(sessionId);
    setTakes(loadedTakes);
    if (loadedTakes.length > 0) {
      const best = loadedTakes.find((t) => t.isBestTake) || loadedTakes[loadedTakes.length - 1];
      setActiveTake(best);
      setNudgeOffsetMs(best.nudgeOffsetMs || 0);
      youtubeSyncMixer.loadVocalTake(best);
    } else {
      setActiveTake(null);
    }

    const est = await youtubeTakeStorageService.getStorageUsageEstimate();
    if (est) setStorageEstimateMb(est.usedMb);
  }, []);

  useEffect(() => {
    initSession(activeVideoId, videoTitle);
  }, [activeVideoId, initSession, videoTitle]);

  // Sync mixer hooks
  useEffect(() => {
    youtubeSyncMixer.onTimeUpdate((currTime, duration) => {
      setBeatCurrentTimeSec(currTime);
      if (duration > 0 && Math.abs(duration - beatDurationSec) > 1) {
        setBeatDurationSec(duration);
      }
    });

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      youtubeSyncMixer.dispose();
      vocalRecordingEngine.dispose();
    };
  }, [beatDurationSec]);

  // Handle URL Paste / Search
  const handleLoadYouTubeUrl = (url?: string) => {
    const targetUrl = url || urlInput;
    const extractedId = extractYouTubeVideoId(targetUrl);
    if (!extractedId) {
      alert('Link YouTube không hợp lệ. Vui lòng dán đường link có chứa video ID chuẩn.');
      return;
    }
    setActiveVideoId(extractedId);
    setVideoTitle(`YouTube Beat (${extractedId})`);
    setPlayerError(null);

    // Auto-extract start time if link has ?t=15s or &t=80
    const startSec = extractYouTubeStartTime(targetUrl);
    if (startSec !== null) {
      setStartPointSec(startSec);
      if (ytPlayerInstance && typeof ytPlayerInstance.seekTo === 'function') {
        ytPlayerInstance.seekTo(startSec, true);
      }
    }
  };

  const handleSelectPreset = (preset: IBeatPreset) => {
    setActiveVideoId(preset.videoId);
    setVideoTitle(preset.title);
    setStartPointSec(preset.suggestedStartSec);
    setPlayerError(null);
  };

  // YouTube Player Ready Link
  const handlePlayerReady = (player: any) => {
    setYtPlayerInstance(player);
    youtubeSyncMixer.attachYouTubePlayer(player);
    try {
      const dur = player.getDuration();
      if (dur) setBeatDurationSec(dur);
    } catch {
      // Ignored
    }
  };

  const handlePlayerStateChange = (state: number) => {
    // 0 = ended, 2 = paused
    if (state === 0 || state === 2) {
      if (isPlayingMix) {
        setIsPlayingMix(false);
        youtubeSyncMixer.pause();
      }
    }
  };

  // Step 2 -> 3: Countdown and Start Recording
  const handleStartCountdown = async () => {
    // Ensure audio context and mic are ready (critical for mobile iOS)
    try {
      await vocalRecordingEngine.setupMic();
    } catch (e) {
      alert('Không thể kết nối Microphone. Vui lòng kiểm tra quyền mic.');
      return;
    }

    setIsCountingDown(true);
    setCountdownNumber(3);
    setCurrentStep('recording'); // Instantly open Karaoke Center Stage so user looks at video lyrics!

    // Seek beat to 3s before startPoint (or 0s) to cue the singer in
    const prerollStartSec = Math.max(0, startPointSec - 3);
    if (ytPlayerInstance && typeof ytPlayerInstance.seekTo === 'function') {
      ytPlayerInstance.seekTo(prerollStartSec, true);
      ytPlayerInstance.playVideo();
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setIsCountingDown(false);
        triggerActualRecording();
      }
    }, 1000);
  };

  const triggerActualRecording = async () => {
    setIsRecording(true);
    setRecordDurationSec(0);

    const startTime = performance.now();
    recordingTimerRef.current = setInterval(() => {
      setRecordDurationSec(Math.round((performance.now() - startTime) / 1000));
    }, 500);

    // Start recording engine
    await vocalRecordingEngine.startRecording((rms, db) => {
      setLiveVuRms(rms);
      setLiveVuDb(db);
    });
  };

  const handleStopRecording = async () => {
    if (!isRecording && !isCountingDown) return;
    setIsRecording(false);
    setIsCountingDown(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Pause YouTube
    if (ytPlayerInstance && typeof ytPlayerInstance.pauseVideo === 'function') {
      ytPlayerInstance.pauseVideo();
    }

    try {
      const result = await vocalRecordingEngine.stopRecording();
      const newTakeNumber = takes.length + 1;
      const takeId = `take-${session?.id || 'sess'}-${Date.now()}`;

      const newTake: IYouTubeTake = {
        id: takeId,
        sessionId: session?.id || `yt-session-${activeVideoId}`,
        takeNumber: newTakeNumber,
        createdAt: Date.now(),
        durationSec: result.durationSec,
        startPointSec: startPointSec,
        nudgeOffsetMs: 0,
        volume: 1.0,
        isBestTake: takes.length === 0, // First take defaults to best
        audioBlob: result.blob,
        waveformData: result.waveformData,
        note: `Bản thu ${newTakeNumber}`,
      };

      await youtubeTakeStorageService.saveTake(newTake);
      const updatedTakes = await youtubeTakeStorageService.getTakesForSession(newTake.sessionId);
      setTakes(updatedTakes);
      setActiveTake(newTake);
      setNudgeOffsetMs(0);
      await youtubeSyncMixer.loadVocalTake(newTake);

      // Transition to Review & Mix
      setCurrentStep('review_mix');

      // Prime YouTube playback head at startPointSec
      if (ytPlayerInstance && typeof ytPlayerInstance.seekTo === 'function') {
        ytPlayerInstance.seekTo(startPointSec, true);
      }

      const est = await youtubeTakeStorageService.getStorageUsageEstimate();
      if (est) setStorageEstimateMb(est.usedMb);
    } catch (err) {
      console.error('Stop recording failed:', err);
      alert('Đã xảy ra lỗi khi lưu bản thu. Vui lòng thử lại.');
      setCurrentStep('prepare');
    }
  };

  const handleDiscardRecording = () => {
    setIsRecording(false);
    setIsCountingDown(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (ytPlayerInstance && typeof ytPlayerInstance.pauseVideo === 'function') {
      ytPlayerInstance.pauseVideo();
    }
    vocalRecordingEngine.stopMicCheck();
    vocalRecordingEngine.stopRecording().catch(() => {});
    setCurrentStep('prepare');
  };

  // Playback & Virtual Mix controls
  const handleTogglePlayMix = async () => {
    if (isPlayingMix) {
      youtubeSyncMixer.pause();
      setIsPlayingMix(false);
    } else {
      await youtubeSyncMixer.play();
      setIsPlayingMix(true);
    }
  };

  const handleSeekBeat = (sec: number) => {
    youtubeSyncMixer.seekTo(sec);
    setBeatCurrentTimeSec(sec);
  };

  const handleBeatVolumeChange = (vol: number) => {
    setBeatVolume(vol);
    youtubeSyncMixer.setBeatVolume(vol);
  };

  const handleVocalVolumeChange = (vol: number) => {
    setVocalVolume(vol);
    youtubeSyncMixer.setVocalVolume(vol);
    if (activeTake) {
      youtubeTakeStorageService.updateTake(activeTake.id, { volume: vol });
    }
  };

  const handleNudgeChange = (newOffsetMs: number) => {
    setNudgeOffsetMs(newOffsetMs);
    youtubeSyncMixer.setNudgeOffsetMs(newOffsetMs);
    if (activeTake) {
      youtubeTakeStorageService.updateTake(activeTake.id, { nudgeOffsetMs: newOffsetMs });
    }
  };

  const handleToggleReverb = () => {
    const next = !isReverb;
    setIsReverb(next);
    youtubeSyncMixer.setReverb(next, 0.28);
  };

  const handleToggleCompressor = () => {
    const next = !isCompressor;
    setIsCompressor(next);
    youtubeSyncMixer.setCompressor(next);
  };

  const handleSelectTake = async (take: IYouTubeTake) => {
    setActiveTake(take);
    setNudgeOffsetMs(take.nudgeOffsetMs || 0);
    setVocalVolume(take.volume ?? 1.0);
    await youtubeSyncMixer.loadVocalTake(take);
  };

  const handleTogglePlayTake = async (take: IYouTubeTake) => {
    if (activeTake?.id !== take.id) {
      await handleSelectTake(take);
      await youtubeSyncMixer.play();
      setIsPlayingMix(true);
    } else {
      await handleTogglePlayMix();
    }
  };

  const handleMarkBestTake = async (takeId: string) => {
    if (!session) return;
    await youtubeTakeStorageService.setBestTake(session.id, takeId);
    const updated = await youtubeTakeStorageService.getTakesForSession(session.id);
    setTakes(updated);
    const best = updated.find((t) => t.id === takeId);
    if (best) setActiveTake(best);
  };

  const handleDeleteTake = async (takeId: string) => {
    await youtubeTakeStorageService.deleteTake(takeId);
    if (!session) return;
    const updated = await youtubeTakeStorageService.getTakesForSession(session.id);
    setTakes(updated);
    if (activeTake?.id === takeId) {
      const nextActive = updated[updated.length - 1] || null;
      setActiveTake(nextActive);
      if (nextActive) {
        youtubeSyncMixer.loadVocalTake(nextActive);
      }
    }
    const est = await youtubeTakeStorageService.getStorageUsageEstimate();
    if (est) setStorageEstimateMb(est.usedMb);
  };

  const handleClearAllTakes = async () => {
    if (!session) return;
    await youtubeTakeStorageService.deleteSession(session.id);
    setTakes([]);
    setActiveTake(null);
    youtubeSyncMixer.pause();
    setIsPlayingMix(false);
    const est = await youtubeTakeStorageService.getStorageUsageEstimate();
    if (est) setStorageEstimateMb(est.usedMb);
  };

  const handleUpdateTakeNote = async (takeId: string, note: string) => {
    await youtubeTakeStorageService.updateTake(takeId, { note });
    if (!session) return;
    const updated = await youtubeTakeStorageService.getTakesForSession(session.id);
    setTakes(updated);
  };

  const handleDownloadVocalWav = (take: IYouTubeTake) => {
    youtubeTakeStorageService.downloadVocalTake(take);
  };

  // Global Keyboard Shortcuts (Space, Enter, Esc, T, B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentStep === 'review_mix' || currentStep === 'prepare') {
          handleTogglePlayMix();
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (currentStep === 'recording') {
          handleStopRecording();
        } else if (currentStep === 'prepare' && !isCountingDown) {
          handleStartCountdown();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (currentStep === 'recording' || isCountingDown) {
          handleDiscardRecording();
        } else if (isLyricPrompterOpen) {
          setIsLyricPrompterOpen(false);
        } else if (isExportModalOpen) {
          setIsExportModalOpen(false);
        }
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        setIsTheaterMode((prev) => !prev);
      } else if (e.code === 'KeyB') {
        if (currentStep === 'review_mix' && activeTake) {
          e.preventDefault();
          handleMarkBestTake(activeTake.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentStep,
    isCountingDown,
    isRecording,
    isPlayingMix,
    activeTake,
    isLyricPrompterOpen,
    isExportModalOpen,
  ]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 1. TOP HEADER & STEPPERS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Radio className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Hát Với Beat YouTube & Mix Ảo</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono uppercase">
                Virtual Mix
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Đồng bộ beat YouTube không trễ, kiểm tra mic 5s, đếm nhịp 3-2-1, thu nhiều take riêng biệt và căn chỉnh lệch mili-giây (nudge).
          </p>
        </div>

        {/* Actions & 4-Step Nav Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lyric Prompter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsLyricPrompterOpen(!isLyricPrompterOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isLyricPrompterOpen
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Mở sổ tay xem hoặc dán lời bài hát để đọc khi hát"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Sổ Nhắc Lời</span>
          </button>

          {/* Theater Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isTheaterMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isTheaterMode ? 'Thu nhỏ về chế độ 2 cột (Phím T)' : 'Mở rộng màn hình Sân Khấu Karaoke (Phím T)'}
          >
            {isTheaterMode ? <Minimize2 className="w-3.5 h-3.5 text-sky-400" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{isTheaterMode ? 'Thu nhỏ' : 'Sân khấu to'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep('choose_beat')}
              disabled={isRecording || isCountingDown}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                currentStep === 'choose_beat'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>① Chọn Beat</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('prepare')}
              disabled={isRecording || isCountingDown}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                currentStep === 'prepare'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>② Chuẩn Bị</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRecording && !isCountingDown) {
                  handleStartCountdown();
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentStep === 'recording'
                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isRecording && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
              <span>③ Thu Âm</span>
            </button>

            <button
              type="button"
              onClick={() => takes.length > 0 && setCurrentStep('review_mix')}
              disabled={takes.length === 0 || isRecording || isCountingDown}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentStep === 'review_mix'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              <span>④ Nghe & Mix ({takes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE PERMANENT KARAOKE STAGE (ALWAYS MOUNTED, FULL FOCUS & UNBLOCKED LYRICS) */}
      <div className={`w-full mx-auto space-y-3 transition-all duration-300 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {/* YouTube Block / Error Banner Alert with 1-click fallback */}
        {playerError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">{playerError.title}: </span>
                <span>{playerError.message}</span>
                <span className="block text-[11px] text-rose-300/80 mt-0.5">💡 {playerError.actionHint}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPreset(POPULAR_BEAT_PRESETS[0])}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Đổi sang Beat Mẫu
              </button>
            </div>
          </div>
        )}

        <div className={`relative rounded-3xl overflow-hidden border-2 shadow-2xl bg-slate-950 transition-all ${
          currentStep === 'recording'
            ? 'border-rose-500/70 ring-4 ring-rose-500/20'
            : isPlayingMix
            ? 'border-sky-500/50 shadow-sky-500/10'
            : 'border-slate-800'
        }`}>
          <YouTubePlayerContainer
            videoId={activeVideoId}
            onPlayerReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={(err) => setPlayerError(err)}
            isCustomPlaying={isPlayingMix || isRecording || isCountingDown}
            onTogglePlay={currentStep !== 'recording' ? handleTogglePlayMix : undefined}
            hidePlayButtonOverlay={currentStep === 'recording' || isCountingDown}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
            className="w-full"
          >
            {/* Subtle Non-Obstructive Countdown Badge at Top-Center */}
            {isCountingDown && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-950/90 border-2 border-amber-400 shadow-2xl backdrop-blur-md animate-bounce">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black">
                    {countdownNumber}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Chuẩn bị vào hát ({countdownNumber}s)
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium">
                      Beat đang dạo - nhìn chữ trên video để vào đúng nhịp!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Recording HUD at Top-Edge (Lyrics area in middle/bottom is 100% visible!) */}
            {currentStep === 'recording' && !isCountingDown && (
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-rose-500/40 text-xs shadow-xl pointer-events-none select-none">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                    Đang Thu (Take #{takes.length + 1})
                  </span>
                  <span className="text-white font-mono font-black text-sm ml-2">
                    {formatTimeMs(recordDurationSec * 1000)}
                  </span>
                </div>

                {/* Live Mic VU Level */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">Mic:</span>
                  <div className="w-24 sm:w-36 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-rose-500 rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.max(4, (liveVuDb + 60) * 1.8))}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {Math.round(liveVuDb)} dB
                  </span>
                </div>
              </div>
            )}
          </YouTubePlayerContainer>
        </div>

        {/* In-tab Lyric Prompter Drawer (if toggled open) */}
        <LyricPrompterDrawer
          videoId={activeVideoId}
          isOpen={isLyricPrompterOpen}
          onClose={() => setIsLyricPrompterOpen(false)}
          isPlaying={isPlayingMix || isRecording}
          currentTimeSec={beatCurrentTimeSec}
          durationSec={beatDurationSec}
        />
      </div>

      {/* 3. CONTEXTUAL STEP CONTROLS (DIRECTLY BELOW VIDEO) */}
      <div className={`w-full mx-auto transition-all duration-300 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {/* STEP 1: CHOOSE BEAT */}
        {currentStep === 'choose_beat' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Video URL Input & Preset Selector */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-sky-400" />
                    <span>Dán Link YouTube hoặc Chọn Beat Mẫu</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hỗ trợ link YouTube thường, link rút gọn youtu.be, và link có mốc thời gian (?t=15s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep('prepare')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  <span>Tiếp tục: Chuẩn Bị Thu</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... hoặc dán link karaoke bất kỳ"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLoadYouTubeUrl();
                    }}
                  />
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadYouTubeUrl()}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Tải Beat
                </button>
              </div>

              {/* Active Beat Selection & Thumbnail Preview Card */}
              {activeVideoId && (
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${activeVideoId}/mqdefault.jpg`}
                      alt="YouTube Beat Thumbnail"
                      className="w-24 h-14 object-cover rounded-lg border border-slate-700 shadow shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white line-clamp-1">{videoTitle}</span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                          {activeVideoId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Intro đề xuất: <strong className="text-slate-300">{startPointSec}s</strong> • Sẵn sàng chuyển sang phòng thu
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('prepare')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-sky-500/10 cursor-pointer"
                  >
                    <span>Sẵn Sàng Hát Beat Này</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Backing Track Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block">
                  Beat mẫu gợi ý (1-click thử ngay):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {POPULAR_BEAT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between cursor-pointer ${
                        activeVideoId === preset.videoId
                          ? 'bg-sky-500/15 border-sky-500 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold truncate">{preset.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">
                        {preset.genre} • Intro: {preset.suggestedStartSec}s
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage & Legal */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  Bản thu lưu cục bộ trên trình duyệt (IndexedDB)
                </span>
                {storageEstimateMb !== null && (
                  <span className="font-mono text-slate-400">Đã dùng: {storageEstimateMb} MB</span>
                )}
              </div>
            </div>

            {/* Previous Takes if any */}
            {takes.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Các take đã thu của bài này ({takes.length} bản):
                </span>
                <TakeManagerList
                  takes={takes}
                  activeTakeId={activeTake?.id || null}
                  isPlaying={isPlayingMix}
                  onSelectTake={handleSelectTake}
                  onTogglePlayTake={handleTogglePlayTake}
                  onMarkBestTake={handleMarkBestTake}
                  onDeleteTake={handleDeleteTake}
                  onUpdateTakeNote={handleUpdateTakeNote}
                  onDownloadVocalWav={handleDownloadVocalWav}
                  onClearAllTakes={handleClearAllTakes}
                  storageUsageMb={storageEstimateMb}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREPARE */}
        {currentStep === 'prepare' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <MicPreflightCheck
              onCheckCompleted={(ready) => setIsMicReady(ready)}
              beatCurrentTimeSec={beatCurrentTimeSec}
              beatDurationSec={beatDurationSec}
              selectedStartPointSec={startPointSec}
              onSetStartPointSec={(sec) => setStartPointSec(sec)}
              onPreviewBeatSeek={(sec) => handleSeekBeat(sec)}
              onTogglePreviewBeat={handleTogglePlayMix}
              isPreviewingBeat={isPlayingMix}
            />

            {/* Big Start Recording CTA */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  Sẵn sàng để ghi âm?
                </span>
                <span className="text-xs text-slate-400">
                  Video YouTube trên sẽ phát đúng đoạn dạo và đếm nhịp 3-2-1 để bạn nhìn chữ bắt nhịp chuẩn xác.
                </span>
              </div>

              <button
                type="button"
                onClick={handleStartCountdown}
                disabled={isCountingDown}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Bắt Đầu Thu (3-2-1)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RECORDING DOCK */}
        {currentStep === 'recording' && (
          <div className="p-4 bg-slate-900/95 border border-rose-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-bold text-white text-sm">
                  Beat YouTube đang chạy • Microphone đang ghi âm trực tiếp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Hãy nhìn vào màn hình video phía trên để đọc chữ karaoke. Khi hát xong, bấm nút &ldquo;Dừng Thu & Lưu Take&rdquo;.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleDiscardRecording}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Hủy bản thu
              </button>
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-emerald-500 hover:from-rose-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-rose-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dừng Thu & Lưu Take</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & MIX */}
        {currentStep === 'review_mix' && activeTake && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Virtual Mix Control Deck */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              {/* Unified Transport & Playhead */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlayMix}
                    className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition cursor-pointer"
                  >
                    {isPlayingMix ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Đang Nghe: Take #{activeTake.takeNumber} ({activeTake.note || 'Bản thu'})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatTimeMs(Math.round(beatCurrentTimeSec * 1000))} /{' '}
                      {formatTimeMs(Math.round(beatDurationSec * 1000))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('prepare')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thu Take Khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất File</span>
                  </button>
                </div>
              </div>

              {/* Unified Seekbar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(10, beatDurationSec || 240)}
                  step={0.5}
                  value={beatCurrentTimeSec}
                  onChange={(e) => handleSeekBeat(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>00:00</span>
                  <span>Thanh tua đồng bộ chung Beat + Giọng</span>
                  <span>{formatTimeMs(Math.round((beatDurationSec || 240) * 1000))}</span>
                </div>
              </div>

              {/* Vocal Waveform Track with Visual Nudge */}
              <VocalWaveformTrack
                take={activeTake}
                beatCurrentTimeSec={beatCurrentTimeSec}
                beatDurationSec={beatDurationSec}
                nudgeOffsetMs={nudgeOffsetMs}
                onSeekToBeatSec={handleSeekBeat}
              />

              {/* Dual Volume Knobs & Nudge Slider */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                {/* Beat Volume */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Âm lượng Beat YT</span>
                    <span className="font-mono font-bold text-sky-400">
                      {Math.round(beatVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={beatVolume}
                    onChange={(e) => handleBeatVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {/* Vocal Volume */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Âm lượng Giọng Thu</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {Math.round(vocalVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={vocalVolume}
                    onChange={(e) => handleVocalVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Nudge Slider (-500ms to +500ms) */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Dịch Giọng (Nudge)</span>
                    <span className={`font-mono font-bold ${
                      nudgeOffsetMs === 0
                        ? 'text-slate-400'
                        : nudgeOffsetMs > 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {nudgeOffsetMs > 0 ? `+${nudgeOffsetMs}ms` : `${nudgeOffsetMs}ms`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={-500}
                    max={500}
                    step={5}
                    value={nudgeOffsetMs}
                    onChange={(e) => handleNudgeChange(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Quick nudge buttons */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleNudgeChange(nudgeOffsetMs - 20)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      -20ms
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudgeChange(0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 hover:text-white"
                    >
                      0ms
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudgeChange(nudgeOffsetMs + 20)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      +20ms
                    </button>
                  </div>
                </div>
              </div>

              {/* Vocal FX: Compressor & Reverb */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-slate-300">Hiệu ứng giọng (Vocal FX):</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Compressor toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompressor}
                      onChange={handleToggleCompressor}
                      className="rounded border-slate-700 bg-slate-800 text-sky-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium">Compressor (Dính giọng)</span>
                  </label>

                  {/* Reverb toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isReverb}
                      onChange={handleToggleReverb}
                      className="rounded border-slate-700 bg-slate-800 text-sky-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium">Reverb phòng nhẹ</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Takes Manager Deck */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <TakeManagerList
                takes={takes}
                activeTakeId={activeTake.id}
                isPlaying={isPlayingMix}
                onSelectTake={handleSelectTake}
                onTogglePlayTake={handleTogglePlayTake}
                onMarkBestTake={handleMarkBestTake}
                onDeleteTake={handleDeleteTake}
                onUpdateTakeNote={handleUpdateTakeNote}
                onDownloadVocalWav={handleDownloadVocalWav}
                onClearAllTakes={handleClearAllTakes}
                storageUsageMb={storageEstimateMb}
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Quick Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 py-2 bg-slate-900/60 border border-slate-800/60 rounded-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-300">Phím tắt nhanh:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">Space (Phát / Dừng)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">Enter (Bắt đầu / Lưu take)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">Esc (Hủy / Đóng)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">T (Sân khấu to)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">B (Chọn Take tốt nhất)</span>
        </div>
      </div>

      {/* EXPORT & COPYRIGHT MODAL */}
      <ExportMixModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        session={session}
        activeTake={activeTake}
        takes={takes}
      />
    </div>
  );
};
