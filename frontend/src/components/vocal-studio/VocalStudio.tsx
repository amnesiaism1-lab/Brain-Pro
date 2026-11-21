import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic2,
  X,
  FileText,
  Music,
  Award,
  AlertCircle,
  Radio,
} from 'lucide-react';
import {
  RunwayRenderState,
  IUserPitchPoint,
  SingSessionStats,
  WordPitchScoreStat,
} from './types';
import {
  vocalFileAnalysisService,
  IVocalAnalysisResult,
  IVocalPhrase,
  IReferencePitchPoint,
} from '../../services/vocalFileAnalysisService';
import {
  updateSinglePhraseLyric,
  mergeWithNextPhrase,
  splitPhraseAtPlayhead,
  adjustAdjacentNoteBarBoundary,
  splitNoteBarOnCanvas,
  mergeAdjacentNoteBarsOnCanvas,
  nudgeLyricOffset,
  shiftLyricByPhraseCount,
} from '../../services/lyricAlignmentService';
import { LyricEditorModal } from './components/LyricEditorModal';
import { SongCandidateModal } from './components/SongCandidateModal';
import {
  vocalPitchService,
  IVocalPitchReading,
} from '../../services/vocalPitchService';
import {
  getPitchFeedback,
  findClosestPitchPoint,
  findPhraseAtTimeBinary,
  findNoteBarAtTimeBinary,
} from './utils/vocalHelpers';
import { auditoryEngine } from '../../services/auditoryEngine';
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
import { YouTubeBeatTab } from './tabs/YouTubeBeatTab';
import { evaluateCentsDeviation, NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';

interface VocalStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreflightModal?: () => void;
}



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
  const lastStatsUiUpdateRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastSingingStateRef = useRef<boolean>(false);
  const activeGuideNoteFreqRef = useRef<number | null>(null);
  const activeGuideBarIdRef = useRef<string | null>(null);

  const stopActiveGuideNote = useCallback(() => {
    if (activeGuideNoteFreqRef.current !== null) {
      try {
        auditoryEngine.stopNote(activeGuideNoteFreqRef.current, 0.08);
      } catch {
        // Ignore audio stop errors
      }
      activeGuideNoteFreqRef.current = null;
    }
    activeGuideBarIdRef.current = null;
  }, []);

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
    octaveConvention: store.octaveConvention,
  });

  const [currentRefPoint, setCurrentRefPoint] = useState<IReferencePitchPoint | null>(null);
  const [userReading, setUserReading] = useState<IVocalPitchReading | null>(null);
  const [currentCentsDiff, setCurrentCentsDiff] = useState<number>(0);
  const [isInTuneNow, setIsInTuneNow] = useState<boolean>(false);
  const [isLyricModalOpen, setIsLyricModalOpen] = useState<boolean>(false);
  const [lyricModalInitialMode, setLyricModalInitialMode] = useState<
    'phrase_list' | 'bulk_paste' | 'cloud_search' | 'tap_sync' | 'ai_transcribe'
  >('phrase_list');
  const [isSongCandidateModalOpen, setIsSongCandidateModalOpen] = useState<boolean>(false);

  const handleOpenLyricModal = (
    initialMode?: 'phrase_list' | 'bulk_paste' | 'cloud_search' | 'tap_sync' | 'ai_transcribe'
  ) => {
    setLyricModalInitialMode(initialMode || 'phrase_list');
    setIsLyricModalOpen(true);
  };

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

  const activeScaleNotes = useMemo(() => {
    if (store.selectedKeyOverride) {
      const root = store.selectedKeyOverride.root;
      const mode = store.selectedKeyOverride.mode;
      const rootIdx = (NOTE_NAMES as readonly string[]).indexOf(root);
      if (rootIdx >= 0) {
        const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
        const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
        const intervals = mode === 'major' ? majorIntervals : minorIntervals;
        return intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]);
      }
    }
    return store.analysisResult?.estimatedKey?.scaleNotes || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  }, [store.selectedKeyOverride, store.analysisResult]);

  const activeKeyName = useMemo(() => {
    if (store.selectedKeyOverride) {
      const root = store.selectedKeyOverride.root;
      const mode = store.selectedKeyOverride.mode;
      const rootIdx = (NOTE_NAMES as readonly string[]).indexOf(root);
      const solfege = rootIdx >= 0 ? SOLFEGE_NAMES[rootIdx] : root;
      return mode === 'major' ? `${solfege} Trưởng (${root} Major)` : `${solfege} Thứ (${root} Minor)`;
    }
    return store.analysisResult?.estimatedKey?.key || 'Đô Trưởng (C Major)';
  }, [store.selectedKeyOverride, store.analysisResult]);

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
    renderStateRef.current.scaleNotes = activeScaleNotes;
    renderStateRef.current.transposeSemitones = store.transposeSemitones;
    renderStateRef.current.snapToScale = store.snapToScale;
    renderStateRef.current.selectedKeyName = activeKeyName;
    renderStateRef.current.octaveConvention = store.octaveConvention;
    renderStateRef.current.phrases = store.analysisResult?.phrases;
  }, [
    store.smartOctaveFold,
    store.toleranceCents,
    store.targetMode,
    store.isWindowLocked,
    store.latencyOffsetMs,
    store.isLoopingActive,
    store.loopStartMs,
    store.loopEndMs,
    store.transposeSemitones,
    store.snapToScale,
    store.octaveConvention,
    store.analysisResult,
    activeScaleNotes,
    activeKeyName,
  ]);

  // 60fps Smooth PLL Visual Playhead Clock & A-B Loop (eliminates quantized audio.currentTime stepping!)
  useEffect(() => {
    if (!isOpen || !store.isPlaying) return;

    let animId: number;
    let lastClockUiUpdate = 0;
    let lastRawAudioMs = -1;
    let audioAnchorMs = renderStateRef.current.currentTimeMs || 0;
    let perfAnchorMs = performance.now();

    const clockLoop = (now: number) => {
      const audio = audioElementRef.current;
      if (audio && !audio.paused) {
        const rawAudioMs = audio.currentTime * 1000;
        const rate = audio.playbackRate || 1;
        const predictedMs = audioAnchorMs + (now - perfAnchorMs) * rate;

        if (lastRawAudioMs < 0 || Math.abs(rawAudioMs - lastRawAudioMs) > 0.5) {
          lastRawAudioMs = rawAudioMs;
          const driftMs = rawAudioMs - predictedMs;
          if (Math.abs(driftMs) > 65) {
            // Hard snap on seeks or buffer stalls
            audioAnchorMs = rawAudioMs;
            perfAnchorMs = now;
          } else {
            // Gentle phase-locked blend so runway scroll stays monotonic & jitter-free at 60fps
            audioAnchorMs = predictedMs + driftMs * 0.28;
            perfAnchorMs = now;
          }
        }

        const durLimitMs =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : Number.POSITIVE_INFINITY;
        const smoothTimeMs = Math.min(durLimitMs, Math.max(0, audioAnchorMs + (now - perfAnchorMs) * rate));
        renderStateRef.current.currentTimeMs = smoothTimeMs;

        // A-B loop check with <20ms accuracy
        if (
          renderStateRef.current.isLoopingActive &&
          renderStateRef.current.loopEndMs !== null &&
          renderStateRef.current.loopStartMs !== null
        ) {
          if (smoothTimeMs >= renderStateRef.current.loopEndMs) {
            const loopStart = renderStateRef.current.loopStartMs;
            audio.currentTime = loopStart / 1000;
            audioAnchorMs = loopStart;
            lastRawAudioMs = loopStart;
            perfAnchorMs = now;
            renderStateRef.current.currentTimeMs = loopStart;
          }
        }

        // Optional real-time acoustic piano guide playing reference melody bars
        const liveStore = useVocalStudioStore.getState();
        if (liveStore.isMelodyGuideEnabled) {
          const effectiveGuideMs = Math.max(
            0,
            renderStateRef.current.currentTimeMs - (renderStateRef.current.latencyOffsetMs ?? 45)
          );
          const guideBar = findNoteBarAtTimeBinary(
            renderStateRef.current.noteBars,
            effectiveGuideMs,
            0
          );
          if (!guideBar) {
            if (activeGuideBarIdRef.current !== null) stopActiveGuideNote();
          } else if (guideBar.id !== activeGuideBarIdRef.current) {
            stopActiveGuideNote();
            const guideMidi = guideBar.midi + (liveStore.transposeSemitones || 0);
            const guideFreq = 440 * Math.pow(2, (guideMidi - 69) / 12);
            try {
              auditoryEngine.startNote(guideFreq, 0.26, { timbrePreset: 'acoustic-piano' });
              activeGuideNoteFreqRef.current = guideFreq;
              activeGuideBarIdRef.current = guideBar.id;
            } catch {
              // Ignore audio synthesis errors
            }
          }
        } else if (activeGuideBarIdRef.current !== null) {
          stopActiveGuideNote();
        }

        // Sync React store clock at ~4Hz (canvas & lyric HUD read renderStateRef directly at 60fps)
        if (now - lastClockUiUpdate > 240) {
          lastClockUiUpdate = now;
          store.setCurrentTimeMs(Math.round(renderStateRef.current.currentTimeMs));
        }
      } else {
        perfAnchorMs = now;
        lastRawAudioMs = -1;
        if (activeGuideBarIdRef.current !== null) stopActiveGuideNote();
      }
      animId = requestAnimationFrame(clockLoop);
    };

    animId = requestAnimationFrame(clockLoop);
    return () => {
      cancelAnimationFrame(animId);
      stopActiveGuideNote();
    };
  }, [isOpen, store.isPlaying, stopActiveGuideNote]);

  // Microphone lifecycle & Real-time Pitch Worklet Subscription
  const handlePitchUpdate = useCallback(
    (reading: IVocalPitchReading) => {
      const now = performance.now();
      const latencyOffsetMs = renderStateRef.current.latencyOffsetMs ?? 45;
      // Effective acoustic time: aligns user ear sound with visual playhead
      const effectiveMs = Math.max(0, renderStateRef.current.currentTimeMs - latencyOffsetMs);
      const refPt = findClosestPitchPoint(
        renderStateRef.current.pitchTrack,
        effectiveMs
      );

      // Identify active phrase, active word, and active NoteBar in O(log N)
      let activePhraseIdx: number | null = null;
      let activeWordKey: string | null = null;
      const activePhraseObj = findPhraseAtTimeBinary(
        store.analysisResult?.phrases,
        effectiveMs
      );
      const activeWordObj = activePhraseObj?.words?.find(
        (w) => effectiveMs >= w.startMs - 30 && effectiveMs <= w.endMs + 30
      );
      if (activePhraseObj) {
        activePhraseIdx = activePhraseObj.phraseIndex;
        if (activeWordObj) {
          activeWordKey = `${activePhraseObj.phraseIndex}_${activeWordObj.wordIndex}`;
        }
      }

      const activeBar = findNoteBarAtTimeBinary(
        store.analysisResult?.noteBars,
        effectiveMs,
        35
      );

      // Compute cents diff with smart octave fold, transpose, and human micro-timing tolerance (±75ms)
      let cents = 0;
      let inTune = false;
      const isTargetVocal = Boolean(
        (refPt && refPt.isVocal && refPt.midi > 0) || activeBar
      );

      if (reading.isSinging && reading.freqHz > 0 && isTargetVocal) {
        const transpose = store.transposeSemitones || 0;
        const snapMidi = (rawM: number): number => {
          let m = rawM + transpose;
          if (store.snapToScale && activeScaleNotes.length > 0) {
            const semi = ((Math.round(m) % 12) + 12) % 12;
            const noteName = NOTE_NAMES[semi];
            if (!activeScaleNotes.includes(noteName)) {
              for (let shift = -1; shift <= 1; shift += 2) {
                const testSemi = (((semi + shift) % 12) + 12) % 12;
                if (activeScaleNotes.includes(NOTE_NAMES[testSemi])) {
                  m = Math.round(m) + shift;
                  break;
                }
              }
            }
          }
          return m;
        };

        const candidateMidis: number[] = [];
        if (refPt && refPt.isVocal && refPt.midi > 0) {
          candidateMidis.push(snapMidi(refPt.midi));
        }
        if (activeBar && activeBar.midi > 0) {
          candidateMidis.push(snapMidi(activeBar.midi));
          candidateMidis.push(snapMidi(activeBar.exactMidi));
        }
        if (activeWordObj) {
          candidateMidis.push(snapMidi(activeWordObj.midi));
          if (activeWordObj.endMidi && activeWordObj.endMidi !== activeWordObj.midi) {
            candidateMidis.push(snapMidi(activeWordObj.endMidi));
          }
        }

        // Also include reference points within ±75ms so natural human timing on low-to-high glides is never penalized
        const track = renderStateRef.current.pitchTrack;
        if (track && track.length > 0) {
          for (let deltaMs = -70; deltaMs <= 70; deltaMs += 35) {
            if (deltaMs === 0) continue;
            const nearPt = findClosestPitchPoint(track, effectiveMs + deltaMs);
            if (nearPt && nearPt.isVocal && nearPt.midi > 0) {
              candidateMidis.push(snapMidi(nearPt.midi));
            }
          }
        }

        let bestCents = Infinity;
        for (const candMidi of candidateMidis) {
          const evalResult = evaluateCentsDeviation(reading.freqHz, candMidi, {
            smartOctaveFold: renderStateRef.current.smartOctaveFold,
            a4: store.concertA4Hz,
          });
          if (Math.abs(evalResult.centsDiff) < Math.abs(bestCents)) {
            bestCents = evalResult.centsDiff;
          }
        }

        cents = Number.isFinite(bestCents) ? bestCents : 0;
        inTune = Math.abs(cents) <= renderStateRef.current.toleranceCents;
      }

      // Update scoring accumulator
      const dtMs = lastFrameTimeRef.current > 0 ? Math.min(50, now - lastFrameTimeRef.current) : 25;
      lastFrameTimeRef.current = now;

      processPitchScoreFrame(accumulatorRef.current, {
        dtMs,
        isSinging: reading.isSinging,
        isTargetVocal,
        inTune,
        centsDiff: cents,
        toleranceCents: renderStateRef.current.toleranceCents,
        activePhraseIndex: activePhraseIdx,
        activeWordKey,
      });

      const scorePct = calculateScorePercentage(accumulatorRef.current);

      // Record pitch trail point aligned with acoustic playhead
      if (reading.isSinging && reading.freqHz > 0) {
        userPitchTrailRef.current.push({
          timeMs: effectiveMs,
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

      // Throttle React HUD state updates cleanly (~7Hz HUD, ~2.2Hz heavy sessionStats)
      // while renderStateRef updates at full worklet rate for zero-latency 60fps Canvas rendering
      const singingStateChanged = reading.isSinging !== lastSingingStateRef.current;
      lastSingingStateRef.current = reading.isSinging;

      if (now - lastUiUpdateRef.current > 140 || singingStateChanged) {
        lastUiUpdateRef.current = now;
        setUserReading(reading);
        setCurrentRefPoint(refPt);
        setCurrentCentsDiff(cents);
        setIsInTuneNow(inTune);
        store.setRealtimeScorePct(scorePct);

        const currentStreakCount = Math.round(accumulatorRef.current.currentStreakMs / 1000);
        store.setCurrentStreak(currentStreakCount);

        if (now - lastStatsUiUpdateRef.current > 450 || singingStateChanged) {
          lastStatsUiUpdateRef.current = now;
          const acc = accumulatorRef.current;
          const phraseScoresMap: Record<number, { total: number; inTune: number }> = {};
          Object.entries(acc.phraseScores).forEach(([k, v]) => {
            phraseScoresMap[Number(k)] = { total: v.totalMs, inTune: v.inTuneMs };
          });

          const wordScoresMap: Record<string, WordPitchScoreStat> = {};
          const tol = renderStateRef.current.toleranceCents || 35;
          Object.entries(acc.wordScores).forEach(([k, v]) => {
            const avgCents = v.totalMs > 0 ? Math.round(v.weightedCentsSum / v.totalMs) : 0;
            const inTuneRatio = v.totalMs > 0 ? v.inTuneMs / v.totalMs : 0;
            const status: 'in_tune' | 'flat' | 'sharp' =
              inTuneRatio >= 0.55 || Math.abs(avgCents) <= tol
                ? 'in_tune'
                : avgCents < 0
                ? 'flat'
                : 'sharp';
            wordScoresMap[k] = {
              total: v.totalMs,
              inTune: v.inTuneMs,
              avgCentsDiff: avgCents,
              status,
            };
          });

          const newStats: SingSessionStats = {
            totalVocalFrames: acc.totalVocalFrames,
            inTuneFrames: acc.inTuneFrames,
            flatFrames: acc.flatFrames,
            sharpFrames: acc.sharpFrames,
            highestStreak: Math.round(acc.highestStreakMs / 1000),
            phraseScores: phraseScoresMap,
            wordScores: wordScoresMap,
          };
          store.setSessionStats(newStats);
        }
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
    if (store.isPlaying) {
      handlePausePlayback();
    } else {
      // If user starts playback from the very beginning (0s) and there is a leading silence gap (> 3s),
      // cue right to 1.2s before the singing onset so they don't have to wait through dead air
      if (
        store.currentTimeMs < 1000 &&
        store.analysisResult?.hasLeadingSilence &&
        (store.analysisResult.firstVocalOnsetMs || 0) > 3000
      ) {
        const cueMs = Math.max(0, (store.analysisResult.firstVocalOnsetMs || 0) - 1200);
        handleSeek(cueMs);
      }
      handleStartPlayback();
    }
  };

  const handleSeek = useCallback((timeMs: number) => {
    const audio = audioElementRef.current;
    const clamped = Math.max(0, Math.min(store.analysisResult?.durationMs || 0, timeMs));
    if (audio) audio.currentTime = clamped / 1000;
    renderStateRef.current.currentTimeMs = clamped;
    store.setCurrentTimeMs(clamped);
  }, [store.analysisResult?.durationMs]);

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

  const handleStepPhrase = useCallback(
    (delta: -1 | 1) => {
      const phrases = store.analysisResult?.phrases;
      if (!phrases || phrases.length === 0) return;
      const t = renderStateRef.current.currentTimeMs;
      const current = findPhraseAtTimeBinary(phrases, t);

      if (delta < 0) {
        if (current && t - current.startMs > 1200) {
          handleSeek(current.startMs);
          return;
        }
        const curIdx = current ? phrases.indexOf(current) : -1;
        if (curIdx > 0) {
          handleSeek(phrases[curIdx - 1].startMs);
          return;
        }
        let target = phrases[0];
        for (let i = phrases.length - 1; i >= 0; i--) {
          if (phrases[i].startMs < t - 200) {
            target = phrases[i];
            break;
          }
        }
        handleSeek(target.startMs);
      } else {
        const curIdx = current ? phrases.indexOf(current) : -1;
        if (curIdx >= 0 && curIdx + 1 < phrases.length) {
          handleSeek(phrases[curIdx + 1].startMs);
          return;
        }
        const next = phrases.find((p) => p.startMs > t + 80);
        if (next) handleSeek(next.startMs);
      }
    },
    [store.analysisResult?.phrases, handleSeek]
  );

  // Keyboard Shortcuts (Space, L, R, M, [, ], F, Arrow Keys)
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
      } else if (e.code === 'BracketLeft') {
        e.preventDefault();
        handleStepPhrase(-1);
      } else if (e.code === 'BracketRight') {
        e.preventDefault();
        handleStepPhrase(1);
      } else if (e.code === 'KeyF' && store.activeTab === 'sing_along') {
        e.preventDefault();
        store.setIsFocusStageMode(!store.isFocusStageMode);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        if (store.isLoopingActive) store.clearLoop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    store.isPlaying,
    store.isLoopingActive,
    store.currentTimeMs,
    store.activeTab,
    store.isFocusStageMode,
    handleStepPhrase,
  ]);

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
      const demo = await vocalFileAnalysisService.generateDemoVocalTrack(preset);
      const analysisResult = await vocalFileAnalysisService.analyzeVocalAudio(
        demo.file,
        demo.name,
        (p: number, s: string) => {
          store.setAnalyzeProgress(p, s);
        }
      );
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

  const handleNavigateToSingAlong = useCallback(
    (autoCueIntro = true) => {
      store.setActiveTab('sing_along');
      // If user enters sing-along tab and there is a leading silence gap,
      // automatically seek to 1.2s before the first vocal onset so they don't see an empty runway!
      if (
        autoCueIntro &&
        store.currentTimeMs < 1000 &&
        store.analysisResult?.hasLeadingSilence &&
        (store.analysisResult.firstVocalOnsetMs || 0) > 2500
      ) {
        const cueMs = Math.max(0, (store.analysisResult.firstVocalOnsetMs || 0) - 1200);
        handleSeek(cueMs);
      }
    },
    [store, handleSeek]
  );

  const handleApplyUpdatedResult = useCallback(
    (updated: IVocalAnalysisResult) => {
      store.pushAnalysisHistory(updated);
      renderStateRef.current.durationMs = updated.durationMs;
      renderStateRef.current.pitchTrack = updated.pitchTrack;
      renderStateRef.current.noteBars = updated.noteBars;
      renderStateRef.current.lowestMidi = updated.vocalRange.lowestMidi;
      renderStateRef.current.highestMidi = updated.vocalRange.highestMidi;
      if (
        audioElementRef.current &&
        updated.audioBlobUrl &&
        audioElementRef.current.src !== updated.audioBlobUrl
      ) {
        audioElementRef.current.src = updated.audioBlobUrl;
        audioElementRef.current.load();
      }
    },
    [store]
  );

  const handleUndo = useCallback(() => {
    const prev = store.undoAnalysisHistory();
    if (prev) {
      renderStateRef.current.durationMs = prev.durationMs;
      renderStateRef.current.pitchTrack = prev.pitchTrack;
      renderStateRef.current.noteBars = prev.noteBars;
      renderStateRef.current.lowestMidi = prev.vocalRange.lowestMidi;
      renderStateRef.current.highestMidi = prev.vocalRange.highestMidi;
    }
  }, [store]);

  const handleRedo = useCallback(() => {
    const next = store.redoAnalysisHistory();
    if (next) {
      renderStateRef.current.durationMs = next.durationMs;
      renderStateRef.current.pitchTrack = next.pitchTrack;
      renderStateRef.current.noteBars = next.noteBars;
      renderStateRef.current.lowestMidi = next.vocalRange.lowestMidi;
      renderStateRef.current.highestMidi = next.vocalRange.highestMidi;
    }
  }, [store]);

  // Global Undo / Redo Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

  const handleTrimLeadingSilence = useCallback(
    (trimMs: number) => {
      if (!store.analysisResult) return;
      const trimmed = vocalFileAnalysisService.trimLeadingSilence(store.analysisResult, trimMs);
      handleApplyUpdatedResult(trimmed);
      handleSeek(0);
    },
    [store.analysisResult, handleApplyUpdatedResult, handleSeek]
  );

  const handleNudgeLyricOffset = useCallback(
    (deltaMs: number) => {
      if (!store.analysisResult) return;
      const nudged = nudgeLyricOffset(store.analysisResult, deltaMs);
      handleApplyUpdatedResult(nudged);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleShiftLyricPhrases = useCallback(
    (deltaPhrases: number) => {
      if (!store.analysisResult) return;
      const shifted = shiftLyricByPhraseCount(store.analysisResult, deltaPhrases);
      handleApplyUpdatedResult(shifted);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleUpdatePhraseLyric = useCallback(
    (phraseIndex: number, newText: string) => {
      if (!store.analysisResult) return;
      const updated = updateSinglePhraseLyric(store.analysisResult, phraseIndex, newText);
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleMergeNextPhrase = useCallback(
    (phraseIndex: number) => {
      if (!store.analysisResult) return;
      const updated = mergeWithNextPhrase(store.analysisResult, phraseIndex);
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleSplitPhrase = useCallback(
    (phraseIndex: number, splitTimeMs?: number) => {
      if (!store.analysisResult) return;
      const updated = splitPhraseAtPlayhead(store.analysisResult, phraseIndex, splitTimeMs);
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleAdjustBarBoundary = useCallback(
    (leftBarId: string, rightBarId: string, newBoundaryMs: number) => {
      if (!store.analysisResult) return;
      const updated = adjustAdjacentNoteBarBoundary(
        store.analysisResult,
        leftBarId,
        rightBarId,
        newBoundaryMs
      );
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleSplitBarAtMs = useCallback(
    (barId: string, splitTimeMs: number) => {
      if (!store.analysisResult) return;
      const updated = splitNoteBarOnCanvas(store.analysisResult, barId, splitTimeMs);
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  const handleMergeAdjacentBars = useCallback(
    (leftBarId: string, rightBarId: string) => {
      if (!store.analysisResult) return;
      const updated = mergeAdjacentNoteBarsOnCanvas(store.analysisResult, leftBarId, rightBarId);
      handleApplyUpdatedResult(updated);
    },
    [store.analysisResult, handleApplyUpdatedResult]
  );

  if (!isOpen) return null;

  const isTargetNoteActive = Boolean(currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0);
  const pitchFeedback = getPitchFeedback(
    currentCentsDiff,
    store.toleranceCents,
    userReading?.isSinging || false,
    isTargetNoteActive
  );

  const activePhrase = findPhraseAtTimeBinary(
    store.analysisResult?.phrases,
    store.currentTimeMs
  );

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
              {store.activeTab === 'youtube_beat'
                ? 'Hát với Beat YouTube & Mix Ảo Multi-Take'
                : store.analysisResult
                ? store.analysisResult.fileName
                : 'Nhập file bài hát để bắt đầu'}
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
            onClick={() => handleNavigateToSingAlong(true)}
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
            onClick={() => store.setActiveTab('youtube_beat')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              store.activeTab === 'youtube_beat'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap">Beat YouTube</span>
            <span className="sm:hidden font-mono font-bold">YT</span>
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
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 custom-scrollbar">
        {store.activeTab === 'analysis' && (
          <AnalysisTab
            analysisResult={store.analysisResult}
            isAnalyzing={store.isAnalyzing}
            analyzeProgress={store.analyzeProgress}
            analyzeStatusText={store.analyzeStatusText}
            onFileSelected={handleFileSelected}
            onLoadDemoTrack={handleLoadDemoTrack}
            onNavigateToSingAlong={() => handleNavigateToSingAlong(true)}
            onLoopPhrase={handleLoopPhrase}
            onOpenLyricModal={handleOpenLyricModal}
            onOpenSongCandidateModal={() => setIsSongCandidateModalOpen(true)}
            onApplyUpdatedResult={handleApplyUpdatedResult}
            onTrimLeadingSilence={handleTrimLeadingSilence}
            onOpenYouTubeBeat={() => store.setActiveTab('youtube_beat')}
            onSkipIntro={(ms) => {
              handleSeek(ms);
              store.setActiveTab('sing_along');
              setTimeout(handleStartPlayback, 50);
            }}
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
            onPrevPhrase={() => handleStepPhrase(-1)}
            onNextPhrase={() => handleStepPhrase(1)}
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
            selectedKeyOverride={store.selectedKeyOverride}
            onSelectKeyOverride={store.setSelectedKeyOverride}
            snapToScale={store.snapToScale}
            onToggleSnapToScale={store.setSnapToScale}
            transposeSemitones={store.transposeSemitones}
            onChangeTranspose={store.setTransposeSemitones}
            octaveConvention={store.octaveConvention}
            onChangeOctaveConvention={store.setOctaveConvention}
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
            onOpenLyricModal={handleOpenLyricModal}
            onOpenSongCandidateModal={() => setIsSongCandidateModalOpen(true)}
            onApplyUpdatedResult={handleApplyUpdatedResult}
            onUpdatePhraseLyric={handleUpdatePhraseLyric}
            onMergeNextPhrase={handleMergeNextPhrase}
            onSplitPhrase={handleSplitPhrase}
            onAdjustBarBoundary={handleAdjustBarBoundary}
            onSplitBarAtMs={handleSplitBarAtMs}
            onMergeAdjacentBars={handleMergeAdjacentBars}
            onTrimLeadingSilence={handleTrimLeadingSilence}
            onNudgeLyricOffset={handleNudgeLyricOffset}
            onShiftLyricPhrases={handleShiftLyricPhrases}
            canUndo={store.canUndo}
            canRedo={store.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        )}

        {store.activeTab === 'report' && store.analysisResult && (
          <ReportTab
            analysisResult={store.analysisResult}
            realtimeScorePct={store.realtimeScorePct}
            sessionStats={store.sessionStats}
            onLoopPhrase={handleLoopPhrase}
            onPracticePhraseSlow={(phrase) => {
              handleSpeedChange(0.85);
              handleLoopPhrase(phrase);
            }}
            onRestartFullSong={() => {
              store.resetSessionStats();
              handleSeek(0);
              store.setActiveTab('sing_along');
              setTimeout(handleStartPlayback, 50);
            }}
            onChooseAnotherSong={() => store.setActiveTab('analysis')}
          />
        )}

        {store.activeTab === 'youtube_beat' && (
          <YouTubeBeatTab />
        )}
      </div>

      {/* 3. LYRIC SYNC & EDITOR MODAL */}
      {store.analysisResult && (
        <LyricEditorModal
          isOpen={isLyricModalOpen}
          analysisResult={store.analysisResult}
          initialMode={lyricModalInitialMode}
          onClose={() => setIsLyricModalOpen(false)}
          onApplyUpdatedResult={handleApplyUpdatedResult}
          onPreviewPhraseAudio={(startMs) => {
            handleSeek(startMs);
            if (!store.isPlaying) handleStartPlayback();
          }}
        />
      )}

      {/* 4. SONG DISAMBIGUATION & CANDIDATE PICKER MODAL */}
      {store.analysisResult && (
        <SongCandidateModal
          isOpen={isSongCandidateModalOpen}
          analysisResult={store.analysisResult}
          onClose={() => setIsSongCandidateModalOpen(false)}
          onApplyUpdatedResult={handleApplyUpdatedResult}
        />
      )}
    </div>
  );
};
