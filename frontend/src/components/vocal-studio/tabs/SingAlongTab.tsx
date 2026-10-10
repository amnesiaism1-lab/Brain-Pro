import React, { useState } from 'react';
import {
  Sparkles,
  Repeat,
  Keyboard,
} from 'lucide-react';
import {
  RunwayRenderState,
  TuningTolerance,
  TargetPitchMode,
  SingSessionStats,
} from '../types';
import { IVocalAnalysisResult, IVocalPhrase, IReferencePitchPoint } from '../../../services/vocalFileAnalysisService';
import { IVocalPitchReading } from '../../../services/vocalPitchService';
import { PitchRunwayCanvas } from '../components/PitchRunwayCanvas';
import { MiniKeyboardScale } from '../components/MiniKeyboardScale';
import { TransportBar } from '../controls/TransportBar';
import { PhraseNavigatorDeck } from '../components/PhraseNavigatorDeck';
import { PitchFeedbackDetail } from '../utils/vocalHelpers';
import { midiToNoteInfo, NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';
import { ISelectedKeyOverride } from '../../../store/vocalStudioStore';

interface SingAlongTabProps {
  analysisResult: IVocalAnalysisResult;
  renderStateRef: React.MutableRefObject<RunwayRenderState>;
  currentTimeMs: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (ms: number) => void;
  onSkip: (sec: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (spd: number) => void;
  musicVolume: number;
  onChangeVolume: (vol: number) => void;
  isMutedMusic: boolean;
  onToggleMuteMusic: () => void;
  isLoopingActive: boolean;
  onToggleLoop: () => void;
  onClearLoop: () => void;
  selectedPhraseIndex: number | null;
  onLoopPhrase: (phrase: IVocalPhrase) => void;
  onViewReport: () => void;

  // Real-time telemetry
  realtimeScorePct: number | null;
  currentStreak: number;
  currentCentsDiff: number;
  isInTuneNow: boolean;
  pitchFeedback: PitchFeedbackDetail;
  currentRefPoint: IReferencePitchPoint | null;
  userReading: IVocalPitchReading | null;

  // Scale and Transpose
  selectedKeyOverride: ISelectedKeyOverride | null;
  onSelectKeyOverride: (key: ISelectedKeyOverride | null) => void;
  snapToScale: boolean;
  onToggleSnapToScale: (val: boolean) => void;
  transposeSemitones: number;
  onChangeTranspose: (semitones: number) => void;
  octaveConvention?: 'fl_studio' | 'international';
  onChangeOctaveConvention?: (val: 'fl_studio' | 'international') => void;

  // Preferences & Options
  toleranceCents: TuningTolerance;
  onChangeTolerance: (val: TuningTolerance) => void;
  targetMode: TargetPitchMode;
  onChangeTargetMode: (val: TargetPitchMode) => void;
  smartOctaveFold: boolean;
  onToggleSmartOctaveFold: () => void;
  isLiveMonitoring: boolean;
  onToggleLiveMonitoring: () => void;
  onOpenPreflightModal?: () => void;
  concertA4Hz: number;
  onChangeConcertA4Hz: (val: number) => void;
  latencyOffsetMs: number;
  onChangeLatencyOffsetMs: (val: number) => void;
  isWindowLocked: boolean;
  onToggleWindowLock: () => void;

  // Phrase Deck stats
  sessionStats: SingSessionStats;
  activePhrase: IVocalPhrase | null;
}

export const SingAlongTab: React.FC<SingAlongTabProps> = ({
  analysisResult,
  renderStateRef,
  currentTimeMs,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSkip,
  playbackSpeed,
  onChangeSpeed,
  musicVolume,
  onChangeVolume,
  isMutedMusic,
  onToggleMuteMusic,
  isLoopingActive,
  onToggleLoop,
  onClearLoop,
  selectedPhraseIndex,
  onLoopPhrase,
  onViewReport,
  realtimeScorePct,
  currentStreak,
  currentCentsDiff,
  isInTuneNow,
  pitchFeedback,
  currentRefPoint,
  userReading,
  selectedKeyOverride,
  onSelectKeyOverride,
  snapToScale,
  onToggleSnapToScale,
  transposeSemitones,
  onChangeTranspose,
  octaveConvention = 'fl_studio',
  onChangeOctaveConvention,
  toleranceCents,
  onChangeTolerance,
  targetMode,
  onChangeTargetMode,
  smartOctaveFold,
  onToggleSmartOctaveFold,
  isLiveMonitoring,
  onToggleLiveMonitoring,
  onOpenPreflightModal,
  concertA4Hz,
  onChangeConcertA4Hz,
  latencyOffsetMs,
  onChangeLatencyOffsetMs,
  isWindowLocked,
  onToggleWindowLock,
  sessionStats,
  activePhrase,
}) => {
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  const activeScaleNotes = React.useMemo(() => {
    if (selectedKeyOverride) {
      const root = selectedKeyOverride.root;
      const mode = selectedKeyOverride.mode;
      const rootIdx = (NOTE_NAMES as readonly string[]).indexOf(root);
      if (rootIdx >= 0) {
        const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
        const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
        const intervals = mode === 'major' ? majorIntervals : minorIntervals;
        return intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]);
      }
    }
    return analysisResult.estimatedKey?.scaleNotes || [];
  }, [selectedKeyOverride, analysisResult]);

  const currentTargetOctave =
    currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0
      ? midiToNoteInfo(currentRefPoint.midi).octave + (octaveConvention === 'international' ? 0 : 1)
      : 5;

  return (
    <div className="w-full max-w-[1850px] mx-auto space-y-4 px-1 sm:px-2">
      {/* 1. DUAL-TRACK RUNWAY CANVAS CONTAINER */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <PitchRunwayCanvas renderStateRef={renderStateRef} />

        {/* Score & Tuner HUD Overlay (Top Left) */}
        <div className="absolute top-3 left-4 flex flex-wrap items-center gap-2 z-10">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Chuẩn Tông:</span>
            <span
              className={`font-black font-mono text-sm ${
                realtimeScorePct === null
                  ? 'text-slate-400'
                  : realtimeScorePct >= 80
                  ? 'text-emerald-400'
                  : realtimeScorePct >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {realtimeScorePct === null ? '–' : `${realtimeScorePct}%`}
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
                onClick={onClearLoop}
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
            <div
              className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden relative"
              title={`${currentCentsDiff > 0 ? `+${currentCentsDiff}` : currentCentsDiff} cents`}
            >
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500" />
              <div
                className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75 ${
                  isInTuneNow ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{
                  left: `${Math.max(0, Math.min(100, ((currentCentsDiff + 50) / 100) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          )}
        </div>

        {/* Target Reference Note Badge (Bottom Right) */}
        <div className="absolute bottom-3 right-4 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 z-10">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Nốt Đang Phát:</span>
          <span className="text-sm font-black font-mono text-sky-400">
            {currentRefPoint?.isVocal && currentRefPoint.midi > 0
              ? (() => {
                  const m = currentRefPoint.midi + (transposeSemitones || 0);
                  const semi = ((Math.round(m) % 12) + 12) % 12;
                  const oct = Math.floor(Math.round(m) / 12) - 1 + (octaveConvention === 'international' ? 0 : 1);
                  return `${NOTE_NAMES[semi]}${oct} (${SOLFEGE_NAMES[semi]} ${oct})`;
                })()
              : 'Nghỉ'}
          </span>
        </div>
      </div>

      {/* 2. MINI-KEYBOARD CHORDS & AUDITORY PREVIEW (Task 1.5) */}
      <MiniKeyboardScale
        scaleNotes={activeScaleNotes}
        activeTargetNote={currentRefPoint?.isVocal ? currentRefPoint.noteName : null}
        activeUserNote={userReading?.isSinging ? userReading.noteName : null}
        currentOctave={currentTargetOctave}
      />

      {/* 3. 3-TIER TRANSPORT & PLAYER CONTROLS DECK */}
      <TransportBar
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        currentTimeMs={currentTimeMs}
        durationMs={analysisResult.durationMs}
        onSeek={onSeek}
        onSkip={onSkip}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={onChangeSpeed}
        musicVolume={musicVolume}
        onChangeVolume={onChangeVolume}
        isMutedMusic={isMutedMusic}
        onToggleMuteMusic={onToggleMuteMusic}
        isLoopingActive={isLoopingActive}
        onToggleLoop={onToggleLoop}
        onViewReport={onViewReport}
        selectedKeyOverride={selectedKeyOverride}
        onSelectKeyOverride={onSelectKeyOverride}
        estimatedKey={analysisResult.estimatedKey}
        topKeyCandidates={analysisResult.topKeyCandidates}
        snapToScale={snapToScale}
        onToggleSnapToScale={onToggleSnapToScale}
        transposeSemitones={transposeSemitones}
        onChangeTranspose={onChangeTranspose}
        octaveConvention={octaveConvention}
        onChangeOctaveConvention={onChangeOctaveConvention}
        toleranceCents={toleranceCents}
        onChangeTolerance={onChangeTolerance}
        targetMode={targetMode}
        onChangeTargetMode={onChangeTargetMode}
        smartOctaveFold={smartOctaveFold}
        onToggleSmartOctaveFold={onToggleSmartOctaveFold}
        isLiveMonitoring={isLiveMonitoring}
        onToggleLiveMonitoring={onToggleLiveMonitoring}
        onOpenPreflightModal={onOpenPreflightModal}
        concertA4Hz={concertA4Hz}
        onChangeConcertA4Hz={onChangeConcertA4Hz}
        latencyOffsetMs={latencyOffsetMs}
        onChangeLatencyOffsetMs={onChangeLatencyOffsetMs}
        isWindowLocked={isWindowLocked}
        onToggleWindowLock={onToggleWindowLock}
      />

      {/* 4. Keyboard hints */}
      <div className="px-2 flex items-center justify-between text-[11px] text-slate-400">
        <button
          type="button"
          onClick={() => setShowKeyboardHints(!showKeyboardHints)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-sky-300 transition"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Phím tắt: Space (Hát/Dừng), L (Lặp A-B), R (Về đầu), M (Mute nhạc)</span>
        </button>

        {isLoopingActive && (
          <button
            type="button"
            onClick={onClearLoop}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            ✕ Dừng lặp câu
          </button>
        )}
      </div>

      {/* 5. PHRASE NAVIGATOR DECK */}
      <PhraseNavigatorDeck
        phrases={analysisResult.phrases}
        durationMs={analysisResult.durationMs}
        currentTimeMs={currentTimeMs}
        activePhraseIndex={activePhrase?.phraseIndex || null}
        selectedPhraseIndex={selectedPhraseIndex}
        isLoopingActive={isLoopingActive}
        sessionStats={sessionStats}
        onLoopPhrase={onLoopPhrase}
        onSeekToPhrase={onSeek}
        onClearLoop={onClearLoop}
      />
    </div>
  );
};
