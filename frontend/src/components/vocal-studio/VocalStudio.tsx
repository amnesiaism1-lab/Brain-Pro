import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic2,
  X,
  FileText,
  Music,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  RunwayRenderState,
  IUserPitchPoint,
  SingSessionStats,
} from './types';
import {
  vocalFileAnalysisService,
  IVocalAnalysisResult,
  IVocalPhrase,
  IReferencePitchPoint,
} from '../../services/vocalFileAnalysisService';
import {
  vocalPitchService,
  IVocalPitchReading,
} from '../../services/vocalPitchService';
import {
  getPitchFeedback,
  findClosestPitchPoint,
} from './utils/vocalHelpers';
import {
  createSessionAccumulator,
  processPitchScoreFrame,
  calculateScorePercentage,
  ISingSessionAccumulator,
} from './engine/scoringEngine';
import { computePitchMeasurement } from './engine/measurement';
import { useVocalStudioStore } from '../../store/vocalStudioStore';
import { AnalysisTab } from './tabs/AnalysisTab';
import { SingAlongTab } from './tabs/SingAlongTab';
import { ReportTab } from './tabs/ReportTab';
import { evaluateCentsDeviation } from '@brain-exercises/shared';

interface VocalStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreflightModal?: () => void;
}

let cachedDemoResult: IVocalAnalysisResult | null = null;

export const VocalStudio: React.FC<VocalStudioProps> = ({
  isOpen,
  onClose,
  onOpenPreflightModal,
}) => {
  const store = useVocalStudioStore();

  // Local component refs for real-time audio and canvas synchronization
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const unsubscribePitchRef = useRef<(() => void) | null>(null);

  const userPitchTrailRef = useRef<IUserPitchPoint[]>([]);
  const accumulatorRef = useRef<ISingSessionAccumulator>(createSessionAccumulator());
  const lastUiUpdateRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastSingingStateRef = useRef<boolean>(false);

  // High-performance render state ref for 60fps Canvas
  const renderStateRef = useRef<RunwayRenderState>({
    currentTimeMs: 0,
    durationMs: 0,
    pitchTrack: [],
    userPitchTrail: [],
    currentRefPoint: null,
    userReading: null,
    isInTuneNow: false,
    currentCentsDiff: 0,
    isLoopingActive: false,
    loopStartMs: null,
    loopEndMs: null,
    smartOctaveFold: store.smartOctaveFold,
    lowestMidi: 48,
    highestMidi: 72,
    toleranceCents: store.toleranceCents,
    targetMode: store.targetMode,
    isWindowLocked: store.isWindowLocked,
    latencyOffsetMs: store.latencyOffsetMs,
  });

  const [currentRefPoint, setCurrentRefPoint] = useState<IReferencePitchPoint | null>(null);
  const [userReading, setUserReading] = useState<IVocalPitchReading | null>(null);
  const [currentCentsDiff, setCurrentCentsDiff] = useState<number>(0);
  const [isInTuneNow, setIsInTuneNow] = useState<boolean>(false);

  // Sync Hash & Back Button (Task 1.2)
  useEffect(() => {
    if (!isOpen) return;

    if (window.location.hash !== '#/vocal-studio') {
      window.history.pushState({ modal: 'vocal-studio' }, '', '#/vocal-studio');
    }

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.location.hash === '#/vocal-studio') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
  }, [isOpen, onClose]);

  // Keep render state ref updated with store settings
  useEffect(() => {
    renderStateRef.current.smartOctaveFold = store.smartOctaveFold;
    renderStateRef.current.toleranceCents = store.toleranceCents;
    renderStateRef.current.targetMode = store.targetMode;
    renderStateRef.current.isWindowLocked = store.isWindowLocked;
    renderStateRef.current.latencyOffsetMs = store.latencyOffsetMs;
    renderStateRef.current.isLoopingActive = store.isLoopingActive;
    renderStateRef.current.loopStartMs = store.loopStartMs;
    renderStateRef.current.loopEndMs = store.loopEndMs;
  }, [
    store.smartOctaveFold,
    store.toleranceCents,
    store.targetMode,
    store.isWindowLocked,
    store.latencyOffsetMs,
    store.isLoopingActive,
    store.loopStartMs,
    store.loopEndMs,
  ]);

  // 60fps Playhead Clock & A-B Loop (Task 0.4)
  useEffect(() => {
    if (!isOpen || !store.isPlaying) return;

    let animId: number;
    let lastClockUiUpdate = 0;

    const clockLoop = () => {
      const audio = audioElementRef.current;
      if (audio && !audio.paused) {
        const exactTimeMs = Math.round(audio.currentTime * 1000);
        renderStateRef.current.currentTimeMs = exactTimeMs;

        // A-B loop check with <20ms accuracy
        if (
          renderStateRef.current.isLoopingActive &&
          renderStateRef.current.loopEndMs !== null &&
          renderStateRef.current.loopStartMs !== null
        ) {
          if (exactTimeMs >= renderStateRef.current.loopEndMs) {
            audio.currentTime = renderStateRef.current.loopStartMs / 1000;
            renderStateRef.current.currentTimeMs = renderStateRef.current.loopStartMs;
          }
        }

        // Throttle React state update to ~4Hz for timeline display
        const now = performance.now();
        if (now - lastClockUiUpdate > 250) {
          lastClockUiUpdate = now;
          store.setCurrentTimeMs(renderStateRef.current.currentTimeMs);
        }
      }
      animId = requestAnimationFrame(clockLoop);
    };

    animId = requestAnimationFrame(clockLoop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, store.isPlaying]);

  // Microphone lifecycle & Real-time Pitch Worklet Subscription
  const handlePitchUpdate = useCallback(
    (reading: IVocalPitchReading) => {
      const now = performance.now();
      const currentMs = renderStateRef.current.currentTimeMs;
      const refPt = findClosestPitchPoint(
        renderStateRef.current.pitchTrack,
        currentMs
      );

      // Compute cents diff with smart octave fold
      let cents = 0;
      let inTune = false;
      const isTargetVocal = Boolean(refPt && refPt.isVocal && refPt.midi > 0);

      if (reading.isSinging && reading.freqHz > 0 && isTargetVocal && refPt) {
        const evalResult = evaluateCentsDeviation(reading.freqHz, refPt.midi, {
          smartOctaveFold: renderStateRef.current.smartOctaveFold,
          a4: store.concertA4Hz,
        });
        cents = evalResult.centsDiff;
        inTune = Math.abs(cents) <= renderStateRef.current.toleranceCents;
      }

      // Update scoring accumulator
      const dtMs = lastFrameTimeRef.current > 0 ? Math.min(50, now - lastFrameTimeRef.current) : 25;
      lastFrameTimeRef.current = now;

      let activePhraseIdx: number | null = null;
      if (store.analysisResult?.phrases) {
        const p = store.analysisResult.phrases.find(
          (ph) => currentMs >= ph.startMs && currentMs <= ph.endMs
        );
        if (p) activePhraseIdx = p.phraseIndex;
      }

      processPitchScoreFrame(accumulatorRef.current, {
        dtMs,
        isSinging: reading.isSinging,
        isTargetVocal,
        inTune,
        centsDiff: cents,
        toleranceCents: renderStateRef.current.toleranceCents,
        activePhraseIndex: activePhraseIdx,
      });

      const scorePct = calculateScorePercentage(accumulatorRef.current);

      // Record pitch trail point
      if (reading.isSinging && reading.freqHz > 0) {
        userPitchTrailRef.current.push({
          timeMs: currentMs,
          midi: reading.midiNumber,
          freqHz: reading.freqHz,
          centsDiff: cents,
          inTune,
        });
        if (userPitchTrailRef.current.length > 500) {
          userPitchTrailRef.current.shift();
        }
      }

      // Sync render state ref directly for 60fps canvas
      renderStateRef.current.userReading = reading;
      renderStateRef.current.currentRefPoint = refPt;
      renderStateRef.current.currentCentsDiff = cents;
      renderStateRef.current.isInTuneNow = inTune;
      renderStateRef.current.userPitchTrail = userPitchTrailRef.current;

      // Throttle React UI state updates to ~10Hz
      const singingStateChanged = reading.isSinging !== lastSingingStateRef.current;
      lastSingingStateRef.current = reading.isSinging;

      if (now - lastUiUpdateRef.current > 100 || singingStateChanged) {
        lastUiUpdateRef.current = now;
        setUserReading(reading);
        setCurrentRefPoint(refPt);
        setCurrentCentsDiff(cents);
        setIsInTuneNow(inTune);
        store.setRealtimeScorePct(scorePct);

        const currentStreakCount = Math.round(accumulatorRef.current.currentStreakMs / 1000);
        store.setCurrentStreak(currentStreakCount);

        const acc = accumulatorRef.current;
        const phraseScoresMap: Record<number, { total: number; inTune: number }> = {};
        Object.entries(acc.phraseScores).forEach(([k, v]) => {
          phraseScoresMap[Number(k)] = { total: v.totalMs, inTune: v.inTuneMs };
        });

        const newStats: SingSessionStats = {
          totalVocalFrames: acc.totalVocalFrames,
          inTuneFrames: acc.inTuneFrames,
          flatFrames: acc.flatFrames,
          sharpFrames: acc.sharpFrames,
          highestStreak: Math.round(acc.highestStreakMs / 1000),
          phraseScores: phraseScoresMap,
        };
        store.setSessionStats(newStats);
      }
    },
    [store.analysisResult]
  );

  const startMicListening = useCallback(async () => {
    store.setMicStatus('connecting');
    try {
      const ok = await vocalPitchService.startListening();
      if (!ok) {
        store.setMicStatus('permission_denied');
        return;
      }
      store.setMicStatus('listening');
      if (unsubscribePitchRef.current) unsubscribePitchRef.current();
      unsubscribePitchRef.current = vocalPitchService.subscribe(handlePitchUpdate);
    } catch {
      store.setMicStatus('error');
    }
  }, [handlePitchUpdate]);

  const stopMicListening = useCallback(() => {
    if (unsubscribePitchRef.current) {
      unsubscribePitchRef.current();
      unsubscribePitchRef.current = null;
    }
    vocalPitchService.stopListening();
    store.setMicStatus('idle');
  }, []);

  // Auto start mic when entering sing_along tab
  useEffect(() => {
    if (isOpen && store.activeTab === 'sing_along' && store.micStatus === 'idle') {
      startMicListening();
    }
    return () => {
      if (!isOpen) stopMicListening();
    };
  }, [isOpen, store.activeTab, startMicListening, stopMicListening]);

  // Audio Playback Controls
  const handleStartPlayback = async () => {
    const audio = audioElementRef.current;
    if (!audio) return;
    try {
      audio.playbackRate = store.playbackSpeed;
      if ('preservesPitch' in audio) (audio as any).preservesPitch = true;
      await audio.play();
      store.setIsPlaying(true);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  const handlePausePlayback = () => {
    const audio = audioElementRef.current;
    if (audio) audio.pause();
    store.setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (store.isPlaying) handlePausePlayback();
    else handleStartPlayback();
  };

  const handleSeek = (timeMs: number) => {
    const audio = audioElementRef.current;
    const clamped = Math.max(0, Math.min(store.analysisResult?.durationMs || 0, timeMs));
    if (audio) audio.currentTime = clamped / 1000;
    renderStateRef.current.currentTimeMs = clamped;
    store.setCurrentTimeMs(clamped);
  };

  const handleSkip = (sec: number) => {
    handleSeek(store.currentTimeMs + sec * 1000);
  };

  const handleSpeedChange = (spd: number) => {
    store.setPlaybackSpeed(spd);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = spd;
    }
  };

  const handleVolumeChange = (vol: number) => {
    store.setMusicVolume(vol);
    if (audioElementRef.current) {
      audioElementRef.current.volume = store.isMutedMusic ? 0 : vol;
    }
  };

  const handleToggleMute = () => {
    const newMute = !store.isMutedMusic;
    store.setIsMutedMusic(newMute);
    if (audioElementRef.current) {
      audioElementRef.current.volume = newMute ? 0 : store.musicVolume;
    }
  };

  const handleToggleMonitoring = async () => {
    const next = !store.isLiveMonitoring;
    store.setIsLiveMonitoring(next);
    vocalPitchService.setLiveMonitoring(next);
  };

  // Keyboard Shortcuts (Space, L, R, M, Arrow Keys)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleSeek(0);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-3);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(3);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        if (store.isLoopingActive) store.clearLoop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, store.isPlaying, store.isLoopingActive, store.currentTimeMs]);

  // File loading & Demo synthesis
  const loadAudioBlob = (blob: Blob, fileName: string, result: IVocalAnalysisResult) => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    currentBlobUrlRef.current = url;
    if (audioElementRef.current) {
      audioElementRef.current.src = url;
      audioElementRef.current.load();
    }
    store.setAnalysisResult(result);
    store.setCurrentTimeMs(0);
    renderStateRef.current.durationMs = result.durationMs;
    renderStateRef.current.pitchTrack = result.pitchTrack;
    renderStateRef.current.noteBars = result.noteBars;
    renderStateRef.current.lowestMidi = result.vocalRange.lowestMidi;
    renderStateRef.current.highestMidi = result.vocalRange.highestMidi;
  };

  const handleFileSelected = async (file: File) => {
    store.setIsAnalyzing(true);
    store.setErrorMessage(null);
    try {
      const result = await vocalFileAnalysisService.analyzeVocalAudio(
        file,
        file.name,
        (p: number, s: string) => {
          store.setAnalyzeProgress(p, s);
        }
      );
      loadAudioBlob(file, file.name, result);
      store.setActiveTab('analysis');
    } catch (err: any) {
      store.setErrorMessage(err.message || 'Không thể phân tích file âm thanh.');
    } finally {
      store.setIsAnalyzing(false);
    }
  };

  const handleLoadDemoTrack = async (preset: 'scale' | 'ballad' | 'pentatonic') => {
    store.setIsAnalyzing(true);
    store.setErrorMessage(null);
    try {
      if (preset === 'scale' && cachedDemoResult) {
        store.setAnalysisResult(cachedDemoResult);
        renderStateRef.current.pitchTrack = cachedDemoResult.pitchTrack;
        renderStateRef.current.noteBars = cachedDemoResult.noteBars;
        renderStateRef.current.durationMs = cachedDemoResult.durationMs;
        store.setActiveTab('analysis');
        store.setIsAnalyzing(false);
        return;
      }
      const demo = await vocalFileAnalysisService.generateDemoVocalTrack(preset);
      const analysisResult = await vocalFileAnalysisService.analyzeVocalAudio(
        demo.file,
        demo.name,
        (p: number, s: string) => {
          store.setAnalyzeProgress(p, s);
        }
      );
      if (preset === 'scale') cachedDemoResult = analysisResult;
      loadAudioBlob(demo.file, demo.name, analysisResult);
      store.setActiveTab('analysis');
    } catch (err: any) {
      store.setErrorMessage(err.message || 'Không thể tạo bản mẫu khởi động.');
    } finally {
      store.setIsAnalyzing(false);
    }
  };

  const handleLoopPhrase = (phrase: IVocalPhrase) => {
    store.setLoop(phrase.startMs, phrase.endMs, phrase.phraseIndex);
    handleSeek(phrase.startMs);
    store.setActiveTab('sing_along');
    if (!store.isPlaying) setTimeout(handleStartPlayback, 50);
  };

  if (!isOpen) return null;

  const isTargetNoteActive = Boolean(currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0);
  const pitchFeedback = getPitchFeedback(
    currentCentsDiff,
    store.toleranceCents,
    userReading?.isSinging || false,
    isTargetNoteActive
  );

  const activePhrase =
    store.analysisResult?.phrases.find(
      (p) =>
        renderStateRef.current.currentTimeMs >= p.startMs &&
        renderStateRef.current.currentTimeMs <= p.endMs
    ) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Hidden Audio Element */}
      <audio
        ref={audioElementRef}
        onEnded={() => {
          store.setIsPlaying(false);
          store.setActiveTab('report');
        }}
        preload="auto"
      />

      {/* 1. STUDIO FULLSCREEN HEADER & 3-STEP STEPPER */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        {/* Brand & File Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span className="hidden sm:inline">Studio Luyện Hát Vocal</span>
              <span className="sm:hidden">Studio Hát</span>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase hidden sm:inline">
                AI Coach
              </span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
              {store.analysisResult ? store.analysisResult.fileName : 'Nhập file bài hát để bắt đầu'}
            </p>
          </div>
        </div>

        {/* 3-Step Stepper Navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 p-0.5 sm:p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => store.setActiveTab('analysis')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              store.activeTab === 'analysis'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap">① Phân Tích</span>
            <span className="sm:hidden font-mono font-bold">①</span>
          </button>

          <button
            type="button"
            disabled={!store.analysisResult}
            onClick={() => store.setActiveTab('sing_along')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              store.activeTab === 'sing_along'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap">② Luyện Hát</span>
            <span className="sm:hidden font-mono font-bold">②</span>
          </button>

          <button
            type="button"
            disabled={!store.analysisResult}
            onClick={() => store.setActiveTab('report')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              store.activeTab === 'report'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap">③ Báo Cáo</span>
            <span className="sm:hidden font-mono font-bold">③</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Đóng Studio"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Inline Error Banner */}
      {store.errorMessage && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{store.errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => store.setErrorMessage(null)}
            className="p-1 hover:text-white text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE TABS */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {store.activeTab === 'analysis' && (
          <AnalysisTab
            analysisResult={store.analysisResult}
            isAnalyzing={store.isAnalyzing}
            analyzeProgress={store.analyzeProgress}
            analyzeStatusText={store.analyzeStatusText}
            onFileSelected={handleFileSelected}
            onLoadDemoTrack={handleLoadDemoTrack}
            onNavigateToSingAlong={() => store.setActiveTab('sing_along')}
            onLoopPhrase={handleLoopPhrase}
          />
        )}

        {store.activeTab === 'sing_along' && store.analysisResult && (
          <SingAlongTab
            analysisResult={store.analysisResult}
            renderStateRef={renderStateRef}
            currentTimeMs={store.currentTimeMs}
            isPlaying={store.isPlaying}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onSkip={handleSkip}
            playbackSpeed={store.playbackSpeed}
            onChangeSpeed={handleSpeedChange}
            musicVolume={store.musicVolume}
            onChangeVolume={handleVolumeChange}
            isMutedMusic={store.isMutedMusic}
            onToggleMuteMusic={handleToggleMute}
            isLoopingActive={store.isLoopingActive}
            onToggleLoop={() => {
              if (store.isLoopingActive) store.clearLoop();
              else if (activePhrase) handleLoopPhrase(activePhrase);
            }}
            onClearLoop={store.clearLoop}
            selectedPhraseIndex={store.selectedPhraseIndex}
            onLoopPhrase={handleLoopPhrase}
            onViewReport={() => {
              handlePausePlayback();
              store.setActiveTab('report');
            }}
            realtimeScorePct={store.realtimeScorePct}
            currentStreak={store.currentStreak}
            currentCentsDiff={currentCentsDiff}
            isInTuneNow={isInTuneNow}
            pitchFeedback={pitchFeedback}
            currentRefPoint={currentRefPoint}
            userReading={userReading}
            toleranceCents={store.toleranceCents}
            onChangeTolerance={store.setToleranceCents}
            targetMode={store.targetMode}
            onChangeTargetMode={store.setTargetMode}
            smartOctaveFold={store.smartOctaveFold}
            onToggleSmartOctaveFold={() => store.setSmartOctaveFold(!store.smartOctaveFold)}
            isLiveMonitoring={store.isLiveMonitoring}
            onToggleLiveMonitoring={handleToggleMonitoring}
            onOpenPreflightModal={onOpenPreflightModal}
            concertA4Hz={store.concertA4Hz}
            onChangeConcertA4Hz={store.setConcertA4Hz}
            latencyOffsetMs={store.latencyOffsetMs}
            onChangeLatencyOffsetMs={store.setLatencyOffsetMs}
            isWindowLocked={store.isWindowLocked}
            onToggleWindowLock={() => store.setIsWindowLocked(!store.isWindowLocked)}
            sessionStats={store.sessionStats}
            activePhrase={activePhrase}
          />
        )}

        {store.activeTab === 'report' && store.analysisResult && (
          <ReportTab
            analysisResult={store.analysisResult}
            realtimeScorePct={store.realtimeScorePct}
            sessionStats={store.sessionStats}
            onLoopPhrase={handleLoopPhrase}
            onRestartFullSong={() => {
              store.resetSessionStats();
              handleSeek(0);
              store.setActiveTab('sing_along');
              setTimeout(handleStartPlayback, 50);
            }}
            onChooseAnotherSong={() => store.setActiveTab('analysis')}
          />
        )}
      </div>
    </div>
  );
};
