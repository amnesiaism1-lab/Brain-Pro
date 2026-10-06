import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  vocalFileAnalysisService, 
  IVocalAnalysisResult, 
  IVocalPhrase, 
  IReferencePitchPoint 
} from '../../services/vocalFileAnalysisService';
import { vocalPitchService, IVocalPitchReading } from '../../services/vocalPitchService';
import { 
  Upload, 
  Mic, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  X, 
  ArrowRight, 
  Headphones, 
  Repeat, 
  Award, 
  BarChart3, 
  FileAudio,
  Loader2,
  Layers,
  Info,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Keyboard,
  FastForward,
  Rewind
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudioTab, MicStatus, TuningTolerance, SingSessionStats, RunwayRenderState } from './types';
import { findClosestPitchPoint, formatTimeMs, getPitchFeedback } from './utils/vocalHelpers';
import { DifficultyBadge } from './components/DifficultyBadge';
import { MicStatusBadge } from './components/MicStatusBadge';
import { PitchRunwayCanvas } from './components/PitchRunwayCanvas';

interface VocalStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreflightModal?: () => void;
}

export const VocalStudioModal: React.FC<VocalStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenPreflightModal,
}) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<StudioTab>('analysis');

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<IVocalAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<number>(0);
  const [analyzeStatusText, setAnalyzeStatusText] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.85);
  const [isMutedMusic, setIsMutedMusic] = useState<boolean>(false);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(false);
  const [smartOctaveFold, setSmartOctaveFold] = useState<boolean>(true);
  const [toleranceCents, setToleranceCents] = useState<TuningTolerance>(35);

  // A-B Looping
  const [loopStartMs, setLoopStartMs] = useState<number | null>(null);
  const [loopEndMs, setLoopEndMs] = useState<number | null>(null);
  const [isLoopingActive, setIsLoopingActive] = useState<boolean>(false);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState<number | null>(null);

  // Microphone & Real-time Pitch Telemetry
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [userReading, setUserReading] = useState<IVocalPitchReading | null>(null);
  const [currentCentsDiff, setCurrentCentsDiff] = useState<number>(0);
  const [isInTuneNow, setIsInTuneNow] = useState<boolean>(false);
  const [realtimeScorePct, setRealtimeScorePct] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // UI state for Help & Keyboard shortcuts
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState<boolean>(false);

  // Session Stats for Diagnostic Report
  const [sessionStats, setSessionStats] = useState<SingSessionStats>({
    totalVocalFrames: 0,
    inTuneFrames: 0,
    flatFrames: 0,
    sharpFrames: 0,
    highestStreak: 0,
    phraseScores: {},
  });

  // Audio Element & Resource Refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const unsubscribePitchRef = useRef<(() => void) | null>(null);
  const statsRef = useRef<SingSessionStats>({
    totalVocalFrames: 0,
    inTuneFrames: 0,
    flatFrames: 0,
    sharpFrames: 0,
    highestStreak: 0,
    phraseScores: {},
  });

  // Loop & audio sync state ref (Fixes BUG-01: prevents stale closure in ontimeupdate)
  const loopStateRef = useRef({
    isLoopingActive,
    loopStartMs,
    loopEndMs,
    activeTab,
    playbackSpeed,
    musicVolume,
    isMutedMusic,
  });

  useEffect(() => {
    loopStateRef.current = {
      isLoopingActive,
      loopStartMs,
      loopEndMs,
      activeTab,
      playbackSpeed,
      musicVolume,
      isMutedMusic,
    };
  }, [isLoopingActive, loopStartMs, loopEndMs, activeTab, playbackSpeed, musicVolume, isMutedMusic]);

  // Canvas render state ref (Fixes BUG-03: decouple canvas 60 FPS animation loop from React renders)
  const renderStateRef = useRef<RunwayRenderState>({
    currentTimeMs: 0,
    durationMs: 0,
    pitchTrack: [],
    currentRefPoint: null,
    userReading: null,
    isInTuneNow: false,
    currentCentsDiff: 0,
    isLoopingActive: false,
    loopStartMs: null,
    loopEndMs: null,
    smartOctaveFold: true,
    lowestMidi: 48,
    highestMidi: 72,
    toleranceCents: 35,
  });

  // Find exact reference pitch at current playback time using binary search (Fixes BUG-04)
  const currentRefPoint = useMemo<IReferencePitchPoint | null>(() => {
    if (!analysisResult) return null;
    return findClosestPitchPoint(analysisResult.pitchTrack, currentTimeMs);
  }, [analysisResult, currentTimeMs]);

  // Current active phrase
  const activePhrase = useMemo<IVocalPhrase | null>(() => {
    if (!analysisResult) return null;
    return analysisResult.phrases.find((p) => currentTimeMs >= p.startMs && currentTimeMs <= p.endMs) || null;
  }, [analysisResult, currentTimeMs]);

  // Synchronize renderStateRef continuously
  useEffect(() => {
    renderStateRef.current = {
      currentTimeMs,
      durationMs: analysisResult?.durationMs || 0,
      pitchTrack: analysisResult?.pitchTrack || [],
      currentRefPoint,
      userReading,
      isInTuneNow,
      currentCentsDiff,
      isLoopingActive,
      loopStartMs,
      loopEndMs,
      smartOctaveFold,
      lowestMidi: analysisResult?.vocalRange.lowestMidi || 48,
      highestMidi: analysisResult?.vocalRange.highestMidi || 72,
      toleranceCents,
    };
  }, [
    currentTimeMs,
    analysisResult,
    currentRefPoint,
    userReading,
    isInTuneNow,
    currentCentsDiff,
    isLoopingActive,
    loopStartMs,
    loopEndMs,
    smartOctaveFold,
    toleranceCents,
  ]);

  // Audio Playback Controls
  const handleStartPlayback = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.playbackRate = loopStateRef.current.playbackSpeed;
    audio.volume = loopStateRef.current.isMutedMusic ? 0 : loopStateRef.current.musicVolume;

    const { isLoopingActive, loopStartMs } = loopStateRef.current;
    if (isLoopingActive && loopStartMs !== null && audio.currentTime * 1000 < loopStartMs) {
      audio.currentTime = loopStartMs / 1000;
    }

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Playback play error:', err);
    });
  }, []);

  const handlePausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!analysisResult) return;
    if (isPlaying) {
      handlePausePlayback();
    } else {
      handleStartPlayback();
    }
  }, [analysisResult, isPlaying, handlePausePlayback, handleStartPlayback]);

  const handleStopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTimeMs(0);
  }, []);

  const handleSeek = useCallback((newTimeMs: number) => {
    const clamped = Math.max(0, Math.min(analysisResult?.durationMs || 0, newTimeMs));
    setCurrentTimeMs(clamped);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = clamped / 1000;
    }
  }, [analysisResult]);

  const handleSkip = useCallback((seconds: number) => {
    if (!analysisResult) return;
    const targetMs = currentTimeMs + seconds * 1000;
    handleSeek(targetMs);
  }, [analysisResult, currentTimeMs, handleSeek]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = speed;
    }
  }, []);

  const handleToggleMuteMusic = useCallback(() => {
    setIsMutedMusic((prev) => {
      const next = !prev;
      if (audioElementRef.current) {
        audioElementRef.current.volume = next ? 0 : musicVolume;
      }
      return next;
    });
  }, [musicVolume]);

  const handleVolumeChange = useCallback((vol: number) => {
    setMusicVolume(vol);
    setIsMutedMusic(false);
    if (audioElementRef.current) {
      audioElementRef.current.volume = vol;
    }
  }, []);

  const handleToggleMonitoring = useCallback(() => {
    setIsLiveMonitoring((prev) => {
      const next = !prev;
      vocalPitchService.setLiveMonitoring(next);
      return next;
    });
  }, []);

  // Set Loop to a specific Phrase (Fixes BUG-05)
  const handleLoopPhrase = useCallback((phrase: IVocalPhrase) => {
    const start = Math.max(0, phrase.startMs - 350);
    const end = phrase.endMs + 350;

    setLoopStartMs(start);
    setLoopEndMs(end);
    setIsLoopingActive(true);
    setSelectedPhraseIndex(phrase.phraseIndex);

    // Seek to phrase start
    handleSeek(start);

    // Switch tab and start playback cleanly
    setActiveTab('sing_along');
    setTimeout(() => {
      handleStartPlayback();
    }, 50);
  }, [handleSeek, handleStartPlayback]);

  const handleClearLoop = useCallback(() => {
    setIsLoopingActive(false);
    setLoopStartMs(null);
    setLoopEndMs(null);
    setSelectedPhraseIndex(null);
  }, []);

  const resetSessionStats = useCallback(() => {
    const fresh: SingSessionStats = {
      totalVocalFrames: 0,
      inTuneFrames: 0,
      flatFrames: 0,
      sharpFrames: 0,
      highestStreak: 0,
      phraseScores: {},
    };
    statsRef.current = fresh;
    setSessionStats(fresh);
    setRealtimeScorePct(0);
    setCurrentStreak(0);
  }, []);

  // Initialize or update HTMLAudioElement lifecycle cleanly (Fixes BUG-01 & BUG-06)
  useEffect(() => {
    if (!analysisResult) return;

    // Revoke previous blob URL if different
    if (currentBlobUrlRef.current && currentBlobUrlRef.current !== analysisResult.audioBlobUrl) {
      try {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      } catch {}
    }
    currentBlobUrlRef.current = analysisResult.audioBlobUrl;

    // Teardown previous audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    const audio = new Audio(analysisResult.audioBlobUrl);
    audioElementRef.current = audio;
    audio.playbackRate = playbackSpeed;
    audio.volume = isMutedMusic ? 0 : musicVolume;

    audio.ontimeupdate = () => {
      const timeMs = audio.currentTime * 1000;
      setCurrentTimeMs(timeMs);

      // A-B Loop check with live ref
      const { isLoopingActive, loopStartMs, loopEndMs } = loopStateRef.current;
      if (isLoopingActive && loopEndMs !== null && loopStartMs !== null) {
        if (timeMs >= loopEndMs) {
          audio.currentTime = loopStartMs / 1000;
        }
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      const { activeTab } = loopStateRef.current;
      if (activeTab === 'sing_along' && statsRef.current.totalVocalFrames > 0) {
        setActiveTab('report');
        try {
          confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    };

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    return () => {
      audio.pause();
      audio.src = '';
      audioElementRef.current = null;
    };
  }, [analysisResult]);

  // Load a demo track on mount if no analysis exists
  useEffect(() => {
    if (isOpen && !analysisResult && !isAnalyzing) {
      handleLoadDemoTrack('scale');
    }
  }, [isOpen]);

  // Stop playback and hardware mic when modal closes (Fixes BUG-02)
  useEffect(() => {
    if (!isOpen) {
      handleStopPlayback();
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
      vocalPitchService.setLiveMonitoring(false);
      vocalPitchService.stopListening(true);
      setMicStatus('idle');
    }
  }, [isOpen, handleStopPlayback]);

  // Manage Microphone lifecycle according to active tab (Fixes BUG-02)
  useEffect(() => {
    if (!isOpen || activeTab !== 'sing_along') {
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
      if (micStatus === 'listening') {
        vocalPitchService.pauseListening();
        setMicStatus('idle');
      }
      return;
    }

    let isSubscribed = true;
    setMicStatus('connecting');

    vocalPitchService
      .startListening()
      .then(() => {
        if (!isSubscribed) return;
        setMicStatus('listening');
        setErrorMessage(null);

        unsubscribePitchRef.current = vocalPitchService.subscribe((reading) => {
          if (isSubscribed) {
            setUserReading(reading);
          }
        });
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        console.warn('Microphone error in vocal studio:', err);
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setMicStatus('permission_denied');
          setErrorMessage('Trình duyệt chưa được cấp quyền Micro. Vui lòng cho phép truy cập micro để hát theo.');
        } else {
          setMicStatus('error');
          setErrorMessage('Không thể khởi tạo thiết bị Micro. Vui lòng kiểm tra lại mic.');
        }
      });

    return () => {
      isSubscribed = false;
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  // Handle Loading Built-in Demo Tracks
  const handleLoadDemoTrack = async (type: 'scale' | 'ballad' | 'pentatonic') => {
    handleStopPlayback();
    setErrorMessage(null);
    setIsAnalyzing(true);
    setAnalyzeProgress(10);
    setAnalyzeStatusText('Đang tạo âm thanh mẫu chất lượng cao...');

    try {
      const demo = await vocalFileAnalysisService.generateDemoVocalTrack(type);
      const result = await vocalFileAnalysisService.analyzeVocalAudio(
        demo.file,
        demo.name,
        (pct, text) => {
          setAnalyzeProgress(pct);
          setAnalyzeStatusText(text);
        }
      );
      setAnalysisResult(result);
      resetSessionStats();
    } catch (err) {
      console.error('Demo load error:', err);
      setErrorMessage('Không thể tạo bài tập mẫu. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle File Input or Drag & Drop (Nielsen Heuristic H5: Error prevention)
  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);

    // 1. Validate file extension & mime type
    const isAudio = file.type.includes('audio') || file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i);
    if (!isAudio) {
      setErrorMessage('File không hợp lệ! Vui lòng chọn file âm thanh (MP3, WAV, M4A, OGG, FLAC).');
      return;
    }

    // 2. File size check (>50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File âm thanh quá lớn (> 50MB). Vui lòng chọn file ngắn hơn hoặc nén lại để tối ưu bộ nhớ.');
      return;
    }

    handleStopPlayback();
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAnalyzeStatusText('Đang nạp file...');

    try {
      const result = await vocalFileAnalysisService.analyzeVocalAudio(
        file,
        file.name,
        (pct, text) => {
          setAnalyzeProgress(pct);
          setAnalyzeStatusText(text);
        }
      );
      setAnalysisResult(result);
      resetSessionStats();
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage('Không thể giải mã file âm thanh này. Bạn hãy thử một file MP3/WAV khác hoặc sử dụng bản mẫu có sẵn.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real-time Pitch Evaluation & Score Accumulator (Fixes BUG-07 & BUG-08)
  useEffect(() => {
    if (!isPlaying || activeTab !== 'sing_along' || !currentRefPoint || !currentRefPoint.isVocal) {
      setIsInTuneNow(false);
      setCurrentCentsDiff(0);
      return;
    }

    if (!userReading || !userReading.isSinging || userReading.freqHz <= 0) {
      setIsInTuneNow(false);
      setCurrentCentsDiff(0);
      return;
    }

    const refMidi = currentRefPoint.midi;
    const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;

    let centsDiff: number;
    if (smartOctaveFold) {
      // Smart octave fold allows male and female voices singing together without penalty
      const octaveShift = Math.round((exactUserMidi - refMidi) / 12);
      const transposedUserMidi = exactUserMidi - octaveShift * 12;
      centsDiff = Math.round((transposedUserMidi - refMidi) * 100);
    } else {
      centsDiff = Math.round((exactUserMidi - refMidi) * 100);
    }

    setCurrentCentsDiff(centsDiff);

    const inTune = Math.abs(centsDiff) <= toleranceCents;
    setIsInTuneNow(inTune);

    // Update session stats ref safely
    const stats = statsRef.current;
    stats.totalVocalFrames++;

    if (inTune) {
      stats.inTuneFrames++;
      stats.highestStreak = Math.max(stats.highestStreak, currentStreak + 1);
      setCurrentStreak((prev) => prev + 1);
    } else {
      setCurrentStreak(0);
      if (centsDiff < -toleranceCents) {
        stats.flatFrames++;
      } else if (centsDiff > toleranceCents) {
        stats.sharpFrames++;
      }
    }

    // Accumulate phrase score
    if (activePhrase) {
      if (!stats.phraseScores[activePhrase.phraseIndex]) {
        stats.phraseScores[activePhrase.phraseIndex] = { total: 0, inTune: 0 };
      }
      stats.phraseScores[activePhrase.phraseIndex].total++;
      if (inTune) {
        stats.phraseScores[activePhrase.phraseIndex].inTune++;
      }
    }

    if (stats.totalVocalFrames > 0) {
      const scorePct = Math.round((stats.inTuneFrames / stats.totalVocalFrames) * 100);
      setRealtimeScorePct(scorePct);
      setSessionStats({ ...stats });
    }
  }, [userReading, currentRefPoint, isPlaying, activeTab, smartOctaveFold, activePhrase, toleranceCents, currentStreak]);

  // Keyboard Shortcuts (Nielsen Heuristic H7: Flexibility and efficiency)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        if (isLoopingActive) {
          handleClearLoop();
        } else if (activePhrase) {
          handleLoopPhrase(activePhrase);
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleSeek(0);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMuteMusic();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-3);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTogglePlay, isLoopingActive, handleClearLoop, activePhrase, handleLoopPhrase, handleSeek, handleToggleMuteMusic, handleSkip]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const pitchFeedback = getPitchFeedback(currentCentsDiff, toleranceCents, !!userReading?.isSinging);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[840px] rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header & Navigation Tabs */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
              <FileAudio className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Studio Luyện Hát Vocal MP3</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    AI Pitch Coach
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {analysisResult ? analysisResult.fileName : 'Nhập file bài hát vocal để phân tích quãng giọng và luyện đúng tông'}
              </p>
            </div>
          </div>

          {/* Right Header: Mic Status & Tabs */}
          <div className="flex items-center gap-3">
            {activeTab === 'sing_along' && (
              <MicStatusBadge
                status={micStatus}
                volumeDb={userReading?.volumeDb}
                isSinging={userReading?.isSinging}
                onRetry={() => {
                  vocalPitchService.startListening().then(() => setMicStatus('listening')).catch(() => setMicStatus('error'));
                }}
                onOpenPreflight={onOpenPreflightModal}
              />
            )}

            {/* Tab Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'analysis'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phân Tích &amp; Kế Hoạch</span>
                <span className="sm:hidden">Phân Tích</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sing_along')}
                disabled={!analysisResult}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-40 ${
                  activeTab === 'sing_along'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phòng Luyện Hát</span>
                <span className="sm:hidden">Luyện Hát</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report')}
                disabled={!analysisResult || sessionStats.totalVocalFrames === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-40 ${
                  activeTab === 'report'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Báo Cáo</span>
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đóng Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Inline Error Banner (Nielsen Heuristic H9) */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-between gap-3 text-xs text-rose-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadDemoTrack('scale')}
                className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold text-[11px] transition"
              >
                Thử Bản Mẫu Khởi Động
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:text-white text-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          
          {/* TAB 1: IMPORT, ANALYSIS & CURATED PRACTICE ROADMAP */}
          {activeTab === 'analysis' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Import & Dropzone Card */}
              <div 
                className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
                  isDraggingFile
                    ? 'border-sky-400 bg-sky-950/30'
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
                }}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Kéo thả file âm thanh Vocal của bạn vào đây</h3>
                    <p className="text-xs text-slate-400 mt-1">Hỗ trợ các định dạng: MP3, WAV, M4A, OGG, FLAC (Tối đa 50MB)</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition shadow-md">
                      <span>Chọn file từ máy tính</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                        }}
                      />
                    </label>

                    {/* Pre-built Demo Tracks Picker */}
                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
                      <span className="text-[11px] text-slate-400">Hoặc thử ngay bản mẫu:</span>
                      <button
                        type="button"
                        onClick={() => handleLoadDemoTrack('scale')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
                      >
                        Khởi Động Đô Trưởng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDemoTrack('ballad')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
                      >
                        Pop Ballad
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDemoTrack('pentatonic')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
                      >
                        Ngũ Cung
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar during analysis */}
                {isAnalyzing && (
                  <div className="absolute inset-0 rounded-3xl bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 gap-3 z-20">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <span className="text-sm font-bold text-white">{analyzeStatusText}</span>
                    <div className="w-64 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-200" 
                        style={{ width: `${analyzeProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-400">{analyzeProgress}%</span>
                  </div>
                )}
              </div>

              {/* Analysis Result Overview Badges */}
              {analysisResult && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Giọng / Âm Giai (Key)</span>
                      <div className="text-sm sm:text-base font-black text-sky-400 mt-0.5 truncate">
                        {analysisResult.estimatedKey.key}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Độ tin cậy: {Math.round(analysisResult.estimatedKey.confidence * 100)}%
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Quãng Giọng (Vocal Range)</span>
                      <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
                        {analysisResult.vocalRange.lowestNote} – {analysisResult.vocalRange.highestNote}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {analysisResult.vocalRange.spanSemitones} bán âm ({analysisResult.vocalRange.recommendedVoiceType})
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Độ Khó Tổng Thể</span>
                      <div className="mt-1">
                        <DifficultyBadge difficulty={analysisResult.vocalMetrics.overallDifficulty} size="md" />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Bước nhảy lớn: {analysisResult.vocalMetrics.maxIntervalSemitones} bán âm
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Số Câu Hát (Phrases)</span>
                      <div className="text-sm sm:text-base font-black text-indigo-400 mt-0.5">
                        {analysisResult.phrases.length} câu
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Thời lượng: {Math.round(analysisResult.durationMs / 1000)}s
                      </div>
                    </div>
                  </div>

                  {/* Curated 4-Step Practice Roadmap */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-slate-950/80 border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Kế Hoạch Luyện Tập Đề Xuất
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sing_along')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-md"
                      >
                        <span>Vào Phòng Luyện Hát</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mb-4">{analysisResult.practicePlan.summaryVi}</p>

                    <div className="space-y-2.5">
                      {analysisResult.practicePlan.recommendedSteps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {step.stepNumber}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{step.title}</div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
                              {step.focusNotes && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="text-[10px] text-slate-500">Nốt trọng tâm:</span>
                                  {step.focusNotes.map((n) => (
                                    <span key={n} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-300">
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {step.targetPhraseIndex && (
                            <button
                              type="button"
                              onClick={() => {
                                const phrase = analysisResult.phrases.find((p) => p.phraseIndex === step.targetPhraseIndex);
                                if (phrase) handleLoopPhrase(phrase);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/30 transition shrink-0 flex items-center gap-1"
                            >
                              <Repeat className="w-3 h-3" />
                              <span>Lặp Câu Này</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phrase Breakdown Table */}
                  <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Danh Sách Phân Đoạn Từng Câu Hát ({analysisResult.phrases.length} câu)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {analysisResult.phrases.map((phrase) => (
                        <div
                          key={phrase.id}
                          className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">Câu {phrase.phraseIndex}</span>
                              <DifficultyBadge difficulty={phrase.difficulty} />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Quãng: <span className="text-slate-300 font-mono">{phrase.lowestNote} – {phrase.highestNote}</span> • Nhảy: {phrase.pitchJumpSemitones} bán âm
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleLoopPhrase(phrase)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-sky-400 text-[11px] font-bold hover:bg-slate-700 transition flex items-center gap-1 shrink-0"
                          >
                            <Repeat className="w-3 h-3" />
                            <span>Luyện câu</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collapsible Coach Guide (Nielsen Heuristic H10) */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowHelpGuide(!showHelpGuide)}
                      className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-sky-400" />
                        <span>Bí quyết luyện hát đạt điểm cao cùng AI Coach</span>
                      </div>
                      {showHelpGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showHelpGuide && (
                      <div className="p-4 pt-0 text-xs text-slate-400 space-y-2 border-t border-slate-800/60">
                        <p>• <strong>Khoảng cách Micro:</strong> Đặt micro cách miệng từ 15 – 20cm, tránh thổi hơi trực tiếp vào đầu thu.</p>
                        <p>• <strong>Tư thế & Lấy hơi:</strong> Đứng hoặc ngồi thẳng lưng, hít sâu bằng cơ hoành (bụng phình ra) để giữ cột hơi ổn định.</p>
                        <p>• <strong>Đường băng Pitch Runway:</strong> Khi bài hát chạy, dải ruy-băng màu tím indigo là cao độ chuẩn. Quả cầu sáng màu ngọc biểu thị giọng hát trực tiếp của bạn. Hãy giữ quả cầu nằm chính giữa dải băng.</p>
                        <p>• <strong>Smart Octave-Fold:</strong> Cho phép giọng Nam và Nữ hát cùng nhau không bị trừ điểm vì lệch quãng 8 tự nhiên.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE SING-ALONG STUDIO */}
          {activeTab === 'sing_along' && analysisResult && (
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Runway Canvas Container */}
              <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <PitchRunwayCanvas renderStateRef={renderStateRef} />

                {/* Score & Tuner HUD Overlay (Top Left) */}
                <div className="absolute top-3 left-4 flex flex-wrap items-center gap-2 z-10">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Chuẩn Tông:</span>
                    <span className={`font-black font-mono text-sm ${
                      sessionStats.totalVocalFrames === 0 
                        ? 'text-slate-400' 
                        : realtimeScorePct >= 80 
                        ? 'text-emerald-400' 
                        : realtimeScorePct >= 60 
                        ? 'text-amber-400' 
                        : 'text-rose-400'
                    }`}>
                      {sessionStats.totalVocalFrames === 0 ? '–' : `${realtimeScorePct}%`}
                    </span>
                  </div>

                  {currentStreak > 3 && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md flex items-center gap-1.5 text-xs text-emerald-300 font-bold animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chuỗi: {currentStreak}</span>
                    </div>
                  )}

                  {isLoopingActive && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-indigo-950/90 border border-indigo-500/50 backdrop-blur-md flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
                      <Repeat className="w-3 h-3 text-indigo-400" />
                      <span>Đang lặp {selectedPhraseIndex ? `câu ${selectedPhraseIndex}` : 'A-B'}</span>
                      <button 
                        type="button" 
                        onClick={handleClearLoop} 
                        className="ml-1 px-1 rounded hover:bg-indigo-800 text-indigo-200"
                        title="Dừng lặp A-B"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time Human Feedback & Tuner Needle (Bottom Left) */}
                <div className="absolute bottom-3 left-4 flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Độ lệch cao độ</span>
                    <span className={`text-xs font-bold ${pitchFeedback.badgeClass}`}>
                      {pitchFeedback.text}
                    </span>
                  </div>

                  {/* Micro Tuner Cents Bar */}
                  {userReading?.isSinging && (
                    <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden relative" title={`${currentCentsDiff} cents`}>
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500" />
                      <div 
                        className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75 ${
                          isInTuneNow ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ 
                          left: `${Math.max(0, Math.min(100, ((currentCentsDiff + 50) / 100) * 100))}%`,
                          transform: 'translateX(-50%)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Target Reference Note Badge (Bottom Right) */}
                <div className="absolute bottom-3 right-4 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 z-10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Nốt Đang Phát:</span>
                  <span className="text-sm font-black font-mono text-sky-400">
                    {currentRefPoint?.isVocal ? `${currentRefPoint.noteName} (${currentRefPoint.solfegeName})` : 'Nghỉ'}
                  </span>
                </div>
              </div>

              {/* Scrubber & Player Timeline Controls */}
              <div className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
                {/* Timeline slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-12 text-right">
                    {formatTimeMs(currentTimeMs)}
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={analysisResult.durationMs}
                    value={currentTimeMs}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <span className="text-xs font-mono text-slate-400 w-12">
                    {formatTimeMs(analysisResult.durationMs)}
                  </span>
                </div>

                {/* Primary Player Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeek(0)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="Quay lại đầu bài (Phím R)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(-3)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition hidden sm:inline-flex"
                      title="Lùi 3 giây (Phím ←)"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-500/25 transition active:scale-95"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-slate-950" />
                          <span>Tạm Dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                          <span>Hát Theo Ngay</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(3)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition hidden sm:inline-flex"
                      title="Tới 3 giây (Phím →)"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>

                    {/* Speed selector */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                      {[0.75, 0.85, 1.0, 1.15].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-1 rounded-lg font-mono font-bold transition ${
                            playbackSpeed === spd
                              ? 'bg-sky-500 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Balances & Smart Toggles */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Music volume slider */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleToggleMuteMusic}
                        className="text-slate-400 hover:text-white transition"
                        title={isMutedMusic ? 'Bật lại tiếng nhạc mẫu (Phím M)' : 'Tắt tiếng nhạc mẫu để tự hát (Phím M)'}
                      >
                        {isMutedMusic ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMutedMusic ? 0 : musicVolume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        title="Âm lượng nhạc mẫu"
                      />
                    </div>

                    {/* Live Mic Monitor toggle */}
                    <button
                      type="button"
                      onClick={handleToggleMonitoring}
                      className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition ${
                        isLiveMonitoring
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Nghe tiếng hát của mình trực tiếp qua tai nghe"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>{isLiveMonitoring ? 'Monitor: Bật' : 'Monitor: Tắt'}</span>
                    </button>

                    {/* Smart Octave Fold toggle */}
                    <button
                      type="button"
                      onClick={() => setSmartOctaveFold(!smartOctaveFold)}
                      className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition ${
                        smartOctaveFold
                          ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Tự động bù quãng 8 cho giọng Nam / Nữ"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Octave-Fold</span>
                    </button>

                    {/* Tolerance Tuning Selector */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]" title="Độ dung sai chuẩn nốt (Cents)">
                      <Sliders className="w-3 h-3 text-slate-400 ml-1" />
                      {([50, 35, 20] as TuningTolerance[]).map((tol) => (
                        <button
                          key={tol}
                          type="button"
                          onClick={() => setToleranceCents(tol)}
                          className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                            toleranceCents === tol
                              ? 'bg-indigo-500 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ±{tol}
                        </button>
                      ))}
                    </div>

                    {/* Finish Practice & View Report button */}
                    <button
                      type="button"
                      onClick={() => {
                        handlePausePlayback();
                        setActiveTab('report');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold transition"
                    >
                      Xem Báo Cáo
                    </button>
                  </div>
                </div>

                {/* Keyboard Shortcut Hints Bar (Heuristic H7) */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowKeyboardHints(!showKeyboardHints)}
                      className="flex items-center gap-1 text-slate-400 hover:text-sky-300 transition"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Phím tắt: Space (Hát/Dừng), L (Lặp A-B), R (Về đầu), M (Mute)</span>
                    </button>
                  </div>

                  {isLoopingActive && (
                    <button
                      type="button"
                      onClick={handleClearLoop}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      ✕ Dừng lặp câu
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Phrase Jump Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">Chọn Câu:</span>
                {analysisResult.phrases.map((phrase) => {
                  const isCurrent = activePhrase?.phraseIndex === phrase.phraseIndex;
                  const score = sessionStats.phraseScores[phrase.phraseIndex];
                  const hasPracticed = score && score.total > 0;
                  const phrasePct = hasPracticed ? Math.round((score.inTune / score.total) * 100) : null;

                  return (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => handleLoopPhrase(phrase)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-300/40'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>Câu {phrase.phraseIndex}</span>
                      <DifficultyBadge difficulty={phrase.difficulty} />
                      {phrasePct !== null && (
                        <span className={`text-[10px] font-mono px-1 rounded ${phrasePct >= 80 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-amber-300'}`}>
                          {phrasePct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC PERFORMANCE REPORT */}
          {activeTab === 'report' && analysisResult && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Overall Score Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-indigo-950/50 border border-emerald-500/40 text-center relative overflow-hidden">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Báo Cáo Độ Chuẩn Tông Giọng Hát</h3>
                <p className="text-xs text-slate-400 mt-1">{analysisResult.fileName}</p>

                <div className="my-4 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-black font-mono text-emerald-400">
                      {realtimeScorePct}%
                    </div>
                    <div className="text-[11px] font-mono uppercase text-slate-400 mt-0.5">Tỉ lệ chuẩn cao độ</div>
                  </div>

                  <div className="h-10 w-px bg-slate-800" />

                  <div className="text-center">
                    <div className="text-2xl font-black font-mono text-sky-400">
                      {sessionStats.highestStreak}
                    </div>
                    <div className="text-[11px] font-mono uppercase text-slate-400 mt-0.5">Chuỗi nốt dài nhất</div>
                  </div>
                </div>

                {/* Breakdown Progress Bars */}
                <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-center">
                    <div className="text-emerald-400 font-bold">{realtimeScorePct}%</div>
                    <div className="text-[10px] text-slate-400">Chuẩn Tông (In-Tune)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/20 text-center">
                    <div className="text-amber-400 font-bold">
                      {sessionStats.totalVocalFrames > 0 ? Math.round((sessionStats.flatFrames / sessionStats.totalVocalFrames) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-slate-400">Bị Non (Flat)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/20 text-center">
                    <div className="text-rose-400 font-bold">
                      {sessionStats.totalVocalFrames > 0 ? Math.round((sessionStats.sharpFrames / sessionStats.totalVocalFrames) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-slate-400">Bị Gắt (Sharp)</div>
                  </div>
                </div>
              </div>

              {/* Phrase-by-Phrase Scorecard */}
              <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Đánh Giá Chi Tiết Từng Câu Hát</span>
                </h4>

                <div className="space-y-2">
                  {analysisResult.phrases.map((phrase) => {
                    const score = sessionStats.phraseScores[phrase.phraseIndex];
                    const pct = score && score.total > 0 ? Math.round((score.inTune / score.total) * 100) : null;

                    return (
                      <div
                        key={phrase.id}
                        className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-xs w-16">Câu {phrase.phraseIndex}</span>
                          <DifficultyBadge difficulty={phrase.difficulty} />
                          <span className="text-[11px] font-mono text-slate-400">
                            {phrase.lowestNote} – {phrase.highestNote}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {pct !== null ? (
                            <span className={`text-xs font-mono font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {pct}% chuẩn
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Chưa thử câu này</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleLoopPhrase(phrase)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 text-sky-400 text-[11px] font-bold hover:bg-slate-700 transition flex items-center gap-1"
                          >
                            <Repeat className="w-3 h-3" />
                            <span>Luyện Lại</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vocal Coach Actionable Feedback */}
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sky-300">Lời Khuyên Của Huấn Luyện Viên:</div>
                  <p className="text-slate-300 leading-relaxed">
                    {sessionStats.flatFrames > sessionStats.sharpFrames
                      ? 'Bạn có xu hướng bị non cao độ (flat) ở các nốt cao. Hãy lấy hơi sâu bằng cơ hoành, giữ thẳng lưng và mở rộng vòm họng để nốt cao thoát âm tự nhiên.'
                      : sessionStats.sharpFrames > sessionStats.flatFrames
                      ? 'Bạn có xu hướng bị gắt (sharp). Hãy thả lỏng cơ hàm và cơ cổ, tránh tống hơi quá mạnh vào micro.'
                      : 'Độ ổn định cao độ của bạn rất tốt! Hãy tiếp tục duy trì luyện tập các câu có bước nhảy quãng rộng để hoàn thiện trọn vẹn bài hát.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetSessionStats();
                    handleSeek(0);
                    setActiveTab('sing_along');
                    setTimeout(() => handleStartPlayback(), 50);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                >
                  Hát Lại Toàn Bài
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analysis')}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition"
                >
                  Chọn Bài Hát Khác
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
