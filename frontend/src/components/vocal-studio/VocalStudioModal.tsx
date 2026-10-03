import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  vocalFileAnalysisService, 
  IVocalAnalysisResult, 
  IVocalPhrase, 
  IReferencePitchPoint 
} from '../../services/vocalFileAnalysisService';
import { vocalPitchService, IVocalPitchReading } from '../../services/vocalPitchService';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  Upload, 
  Music, 
  Mic, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Activity, 
  X, 
  ArrowRight, 
  Headphones, 
  Repeat, 
  Award, 
  BarChart3, 
  ChevronRight, 
  FileAudio,
  Wand2,
  Gauge,
  Layers,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VocalStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreflightModal?: () => void;
}

type StudioTab = 'analysis' | 'sing_along' | 'report';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface SingSessionStats {
  totalVocalFrames: number;
  inTuneFrames: number;
  flatFrames: number;
  sharpFrames: number;
  highestStreak: number;
  phraseScores: Record<number, { total: number; inTune: number }>;
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

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.85);
  const [isMutedMusic, setIsMutedMusic] = useState<boolean>(false);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(false);
  const [smartOctaveFold, setSmartOctaveFold] = useState<boolean>(true);

  // A-B Looping
  const [loopStartMs, setLoopStartMs] = useState<number | null>(null);
  const [loopEndMs, setLoopEndMs] = useState<number | null>(null);
  const [isLoopingActive, setIsLoopingActive] = useState<boolean>(false);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState<number | null>(null);

  // Real-time Pitch & Scoring Telemetry
  const [userReading, setUserReading] = useState<IVocalPitchReading | null>(null);
  const [currentCentsDiff, setCurrentCentsDiff] = useState<number>(0);
  const [isInTuneNow, setIsInTuneNow] = useState<boolean>(false);
  const [realtimeScorePct, setRealtimeScorePct] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Session Stats for Report
  const [sessionStats, setSessionStats] = useState<SingSessionStats>({
    totalVocalFrames: 0,
    inTuneFrames: 0,
    flatFrames: 0,
    sharpFrames: 0,
    highestStreak: 0,
    phraseScores: {},
  });

  // Audio Element & Canvas Refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const unsubscribePitchRef = useRef<(() => void) | null>(null);
  const statsRef = useRef<SingSessionStats>({
    totalVocalFrames: 0,
    inTuneFrames: 0,
    flatFrames: 0,
    sharpFrames: 0,
    highestStreak: 0,
    phraseScores: {},
  });

  // Load a demo track on mount if no analysis exists
  useEffect(() => {
    if (isOpen && !analysisResult && !isAnalyzing) {
      handleLoadDemoTrack('scale');
    }
  }, [isOpen]);

  // Clean up resources on unmount or close
  useEffect(() => {
    if (!isOpen) {
      handleStopPlayback();
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
      vocalPitchService.setLiveMonitoring(false);
    }
  }, [isOpen]);

  // Start microphone tracking when in sing_along tab
  useEffect(() => {
    if (isOpen && activeTab === 'sing_along') {
      vocalPitchService.startListening().catch((err) => {
        console.warn('Microphone error in vocal studio:', err);
      });

      unsubscribePitchRef.current = vocalPitchService.subscribe((reading) => {
        setUserReading(reading);
      });
    } else {
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
    }

    return () => {
      if (unsubscribePitchRef.current) {
        unsubscribePitchRef.current();
        unsubscribePitchRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  // Handle Loading Built-in Demo Tracks
  const handleLoadDemoTrack = async (type: 'scale' | 'ballad' | 'pentatonic') => {
    handleStopPlayback();
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle File Input or Drag & Drop
  const handleFileSelected = async (file: File) => {
    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)) {
      alert('Vui lòng chọn một file âm thanh hợp lệ (MP3, WAV, M4A, OGG).');
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
      alert('Không thể giải mã file âm thanh này. Vui lòng thử một file MP3/WAV khác.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetSessionStats = () => {
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
  };

  // Audio Playback Controls
  const handleTogglePlay = () => {
    if (!analysisResult) return;

    if (isPlaying) {
      handlePausePlayback();
    } else {
      handleStartPlayback();
    }
  };

  const handleStartPlayback = () => {
    if (!analysisResult) return;

    if (!audioElementRef.current) {
      const audio = new Audio(analysisResult.audioBlobUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        if (activeTab === 'sing_along') {
          setActiveTab('report');
          try {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
          } catch {}
        }
      };

      audio.ontimeupdate = () => {
        const timeMs = audio.currentTime * 1000;
        setCurrentTimeMs(timeMs);

        // A-B Loop check
        if (isLoopingActive && loopEndMs !== null && loopStartMs !== null) {
          if (timeMs >= loopEndMs) {
            audio.currentTime = loopStartMs / 1000;
          }
        }
      };
    }

    const audio = audioElementRef.current;
    audio.playbackRate = playbackSpeed;
    audio.volume = isMutedMusic ? 0 : musicVolume;

    if (isLoopingActive && loopStartMs !== null && audio.currentTime * 1000 < loopStartMs) {
      audio.currentTime = loopStartMs / 1000;
    }

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Playback play error:', err);
    });
  };

  const handlePausePlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleStopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTimeMs(0);
  };

  const handleSeek = (newTimeMs: number) => {
    setCurrentTimeMs(newTimeMs);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTimeMs / 1000;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = speed;
    }
  };

  const handleToggleMuteMusic = () => {
    const next = !isMutedMusic;
    setIsMutedMusic(next);
    if (audioElementRef.current) {
      audioElementRef.current.volume = next ? 0 : musicVolume;
    }
  };

  const handleVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    setIsMutedMusic(false);
    if (audioElementRef.current) {
      audioElementRef.current.volume = vol;
    }
  };

  const handleToggleMonitoring = () => {
    const next = !isLiveMonitoring;
    setIsLiveMonitoring(next);
    vocalPitchService.setLiveMonitoring(next);
  };

  // Set Loop to Phrase
  const handleLoopPhrase = (phrase: IVocalPhrase) => {
    setLoopStartMs(Math.max(0, phrase.startMs - 400));
    setLoopEndMs(phrase.endMs + 500);
    setIsLoopingActive(true);
    setSelectedPhraseIndex(phrase.phraseIndex);
    handleSeek(Math.max(0, phrase.startMs - 400));
    setActiveTab('sing_along');
    if (!isPlaying) {
      handleStartPlayback();
    }
  };

  const handleClearLoop = () => {
    setIsLoopingActive(false);
    setLoopStartMs(null);
    setLoopEndMs(null);
    setSelectedPhraseIndex(null);
  };

  // Find reference pitch at current playback time
  const currentRefPoint = useMemo<IReferencePitchPoint | null>(() => {
    if (!analysisResult) return null;
    const track = analysisResult.pitchTrack;
    if (track.length === 0) return null;

    // Binary search or fast linear scan
    const approxIndex = Math.floor((currentTimeMs / analysisResult.durationMs) * track.length);
    const start = Math.max(0, approxIndex - 20);
    const end = Math.min(track.length - 1, approxIndex + 20);

    let closest = track[approxIndex] || track[0];
    let minDiff = Math.abs(closest.timeMs - currentTimeMs);

    for (let i = start; i <= end; i++) {
      const diff = Math.abs(track[i].timeMs - currentTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = track[i];
      }
    }
    return closest;
  }, [analysisResult, currentTimeMs]);

  // Current active phrase
  const activePhrase = useMemo<IVocalPhrase | null>(() => {
    if (!analysisResult) return null;
    return analysisResult.phrases.find((p) => currentTimeMs >= p.startMs && currentTimeMs <= p.endMs) || null;
  }, [analysisResult, currentTimeMs]);

  // Real-time Pitch Evaluation & Score Accumulator
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

    // Reference note MIDI
    const refMidi = currentRefPoint.midi;
    // User note MIDI
    const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;

    let centsDiff: number;
    if (smartOctaveFold) {
      // Smart octave fold so males and females singing together don't get penalized
      const octaveShift = Math.round((exactUserMidi - refMidi) / 12);
      const transposedUserMidi = exactUserMidi - octaveShift * 12;
      centsDiff = Math.round((transposedUserMidi - refMidi) * 100);
    } else {
      centsDiff = Math.round((exactUserMidi - refMidi) * 100);
    }

    setCurrentCentsDiff(centsDiff);

    const tolerance = 35; // ±35 cents is standard musical in-tune boundary
    const inTune = Math.abs(centsDiff) <= tolerance;
    setIsInTuneNow(inTune);

    // Update session stats
    const stats = statsRef.current;
    stats.totalVocalFrames++;

    if (inTune) {
      stats.inTuneFrames++;
      setCurrentStreak((s) => {
        const next = s + 1;
        if (next > stats.highestStreak) stats.highestStreak = next;
        return next;
      });
    } else {
      setCurrentStreak(0);
      if (centsDiff < -tolerance) stats.flatFrames++;
      else if (centsDiff > tolerance) stats.sharpFrames++;
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
  }, [userReading, currentRefPoint, isPlaying, activeTab, smartOctaveFold, activePhrase]);

  // Dual-Track Pitch Runway Visualizer (Canvas Rendering Loop)
  useEffect(() => {
    if (activeTab !== 'sing_along' || !canvasRef.current || !analysisResult) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRendering = true;

    const renderRunway = () => {
      if (!isRendering) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear with gradient dark background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Time runway window: 1 second in past to 3.5 seconds in future (total 4.5s)
      const pastWindowMs = 1200;
      const futureWindowMs = 3300;
      const totalWindowMs = pastWindowMs + futureWindowMs;
      const playheadX = (pastWindowMs / totalWindowMs) * width;

      // MIDI vertical bounds
      const minMidi = Math.max(36, analysisResult.vocalRange.lowestMidi - 4);
      const maxMidi = Math.min(84, analysisResult.vocalRange.highestMidi + 4);
      const midiSpan = Math.max(16, maxMidi - minMidi);

      const midiToY = (m: number) => {
        const norm = (m - minMidi) / midiSpan;
        return height - norm * height;
      };

      // 2. Draw Horizontal Semitone Grid Lines
      for (let m = minMidi; m <= maxMidi; m++) {
        const y = midiToY(m);
        const isC = m % 12 === 0;

        ctx.strokeStyle = isC ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = isC ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Note Label on Left
        const noteIndex = ((m % 12) + 12) % 12;
        const oct = Math.floor(m / 12) - 1;
        const noteStr = `${NOTE_NAMES[noteIndex]}${oct}`;

        ctx.fillStyle = isC ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
        ctx.font = isC ? 'bold 11px monospace' : '10px monospace';
        ctx.fillText(noteStr, 8, y - 3);
      }

      // 3. Draw Loop Overlay if Active
      if (isLoopingActive && loopStartMs !== null && loopEndMs !== null) {
        const loopX1 = playheadX + ((loopStartMs - currentTimeMs) / totalWindowMs) * width;
        const loopX2 = playheadX + ((loopEndMs - currentTimeMs) / totalWindowMs) * width;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(Math.max(0, loopX1), 0, Math.max(0, loopX2 - loopX1), height);

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(Math.max(0, loopX1), 0, Math.max(0, loopX2 - loopX1), height);
        ctx.setLineDash([]);
      }

      // 4. Draw Reference Vocal Pitch Path (Cyan / Indigo Glowing Ribbon)
      const track = analysisResult.pitchTrack;
      const windowStartMs = currentTimeMs - pastWindowMs;
      const windowEndMs = currentTimeMs + futureWindowMs;

      ctx.save();
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#6366f1';

      let drawingSubpath = false;
      ctx.beginPath();
      ctx.strokeStyle = '#818cf8';

      for (let i = 0; i < track.length; i++) {
        const pt = track[i];
        if (pt.timeMs < windowStartMs || pt.timeMs > windowEndMs) continue;

        const x = playheadX + ((pt.timeMs - currentTimeMs) / totalWindowMs) * width;

        if (pt.isVocal && pt.midi > 0) {
          const y = midiToY(pt.midi);
          if (!drawingSubpath) {
            ctx.moveTo(x, y);
            drawingSubpath = true;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          if (drawingSubpath) {
            ctx.stroke();
            ctx.beginPath();
            drawingSubpath = false;
          }
        }
      }
      if (drawingSubpath) ctx.stroke();
      ctx.restore();

      // 5. Draw Target Note Hit-Box under playhead
      if (currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
        const targetY = midiToY(currentRefPoint.midi);

        // Glowing target pill
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = isInTuneNow ? '#34d399' : '#818cf8';
        ctx.fillStyle = isInTuneNow ? 'rgba(52, 211, 153, 0.35)' : 'rgba(129, 140, 248, 0.3)';
        ctx.strokeStyle = isInTuneNow ? '#34d399' : '#a5b4fc';
        ctx.lineWidth = 2;

        const boxW = 80;
        const boxH = 22;
        ctx.beginPath();
        ctx.roundRect(playheadX - boxW / 2, targetY - boxH / 2, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentRefPoint.noteName, playheadX, targetY + 4);
        ctx.restore();
      }

      // 6. Draw User Real-Time Live Microphone Pitch Indicator
      if (userReading && userReading.isSinging && userReading.freqHz > 0) {
        const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;

        // Apply smart octave folding to user coordinate
        let displayMidi = exactUserMidi;
        if (smartOctaveFold && currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
          const octShift = Math.round((exactUserMidi - currentRefPoint.midi) / 12);
          displayMidi = exactUserMidi - octShift * 12;
        }

        const userY = midiToY(displayMidi);

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = isInTuneNow ? '#10b981' : Math.abs(currentCentsDiff) < 60 ? '#f59e0b' : '#ef4444';
        ctx.fillStyle = isInTuneNow ? '#34d399' : Math.abs(currentCentsDiff) < 60 ? '#fbbf24' : '#f87171';

        // Outer pulse circle
        ctx.beginPath();
        ctx.arc(playheadX, userY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright white center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(playheadX, userY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Draw Playhead Vertical Guide Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      animFrameRef.current = requestAnimationFrame(renderRunway);
    };

    renderRunway();

    return () => {
      isRendering = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, analysisResult, currentTimeMs, currentRefPoint, userReading, isInTuneNow, isLoopingActive, loopStartMs, loopEndMs, smartOctaveFold]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
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
              <span>Phân Tích &amp; Kế Hoạch</span>
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
              <span>Phòng Luyện Hát</span>
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                    <p className="text-xs text-slate-400 mt-1">Hỗ trợ các định dạng: MP3, WAV, M4A, OGG, FLAC</p>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
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
                    <Wand2 className="w-8 h-8 text-sky-400 animate-spin" />
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
                      <div className="text-sm sm:text-base font-black text-amber-400 mt-0.5">
                        {analysisResult.vocalMetrics.overallDifficulty}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
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
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/30 transition shrink-0"
                            >
                              Lặp Câu Này
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
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                phrase.difficulty === 'Thử thách' 
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30' 
                                  : phrase.difficulty === 'Trung bình' 
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {phrase.difficulty}
                              </span>
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
                </>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE SING-ALONG STUDIO (REAL-TIME DUAL-TRACK RUNWAY) */}
          {activeTab === 'sing_along' && analysisResult && (
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Runway Canvas Container */}
              <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={860}
                  height={260}
                  className="w-full h-[240px] sm:h-[280px] block"
                />

                {/* Score & Tuner HUD Overlay */}
                <div className="absolute top-3 left-4 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Chuẩn Tông:</span>
                    <span className={`font-black font-mono text-sm ${realtimeScorePct >= 80 ? 'text-emerald-400' : realtimeScorePct >= 60 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {realtimeScorePct}%
                    </span>
                  </div>

                  {currentStreak > 3 && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md flex items-center gap-1.5 text-xs text-emerald-300 font-bold animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Streak: {currentStreak}</span>
                    </div>
                  )}

                  {isLoopingActive && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-indigo-950/90 border border-indigo-500/50 backdrop-blur-md flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
                      <Repeat className="w-3 h-3 text-indigo-400" />
                      <span>Đang lặp câu {selectedPhraseIndex || ''}</span>
                      <button type="button" onClick={handleClearLoop} className="ml-1 hover:text-white">✕</button>
                    </div>
                  )}
                </div>

                {/* Real-time Tuner Cents Needle Overlay (Bottom Left) */}
                <div className="absolute bottom-3 left-4 flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Độ Lệch Cents</span>
                    <span className={`text-xs font-mono font-bold ${isInTuneNow ? 'text-emerald-400' : Math.abs(currentCentsDiff) < 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {currentCentsDiff > 0 ? `+${currentCentsDiff}` : currentCentsDiff} cents
                    </span>
                  </div>

                  {/* Micro Tuner Bar */}
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600" />
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
                </div>

                {/* Target Note Badge (Bottom Right) */}
                <div className="absolute bottom-3 right-4 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Nốt Đang Phát:</span>
                  <span className="text-sm font-black font-mono text-sky-400">
                    {currentRefPoint?.isVocal ? `${currentRefPoint.noteName} (${currentRefPoint.solfegeName})` : 'Nghỉ'}
                  </span>
                </div>
              </div>

              {/* Scrubber & Player Timeline */}
              <div className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
                {/* Timeline slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-12 text-right">
                    {Math.floor(currentTimeMs / 60000)}:
                    {String(Math.floor((currentTimeMs % 60000) / 1000)).padStart(2, '0')}
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
                    {Math.floor(analysisResult.durationMs / 60000)}:
                    {String(Math.floor((analysisResult.durationMs % 60000) / 1000)).padStart(2, '0')}
                  </span>
                </div>

                {/* Primary Player Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeek(0)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="Quay lại đầu bài"
                    >
                      <RotateCcw className="w-4 h-4" />
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
                  <div className="flex items-center gap-3 text-xs">
                    {/* Music volume slider */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleToggleMuteMusic}
                        className="text-slate-400 hover:text-white transition"
                        title={isMutedMusic ? 'Bật lại tiếng nhạc mẫu' : 'Tắt tiếng nhạc mẫu để tự hát'}
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
                      title="Tự động dịch quãng 8 cho nam/nữ"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Octave-Fold</span>
                    </button>

                    {/* Finish Practice & View Report button */}
                    <button
                      type="button"
                      onClick={() => {
                        handlePausePlayback();
                        setActiveTab('report');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold transition"
                    >
                      Xem Kết Quả
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Phrase Jump Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">Chọn Câu:</span>
                {analysisResult.phrases.map((phrase) => {
                  const isCurrent = activePhrase?.phraseIndex === phrase.phraseIndex;
                  return (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => handleLoopPhrase(phrase)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>Câu {phrase.phraseIndex}</span>
                      <span className="text-[9px] opacity-75 font-mono">({phrase.lowestNote}-{phrase.highestNote})</span>
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
                            className="px-2.5 py-1 rounded-xl bg-slate-800 text-sky-400 text-[11px] font-bold hover:bg-slate-700 transition"
                          >
                            Luyện Lại
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
                    handleStartPlayback();
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
