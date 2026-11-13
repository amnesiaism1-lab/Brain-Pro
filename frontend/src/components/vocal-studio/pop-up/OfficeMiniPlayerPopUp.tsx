import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Shield,
  Headphones,
  RotateCcw,
  Sparkles,
  Terminal,
  Music,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sliders,
  Keyboard,
  Mic,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useVocalStudioStore } from '../../../store/vocalStudioStore';
import { vocalPitchService, IVocalPitchReading } from '../../../services/vocalPitchService';
import { auditoryEngine } from '../../../services/auditoryEngine';
import { getNoteFrequency } from '../../../services/musicTheoryService';
import { DecibelGuardBar } from './DecibelGuardBar';
import { OfficeMiniRunway } from './OfficeMiniRunway';

interface OfficeMiniPlayerPopUpProps {
  onClose?: () => void;
  onMaximize?: () => void;
  targetNote?: string;
  onNextTarget?: () => void;
}

const SCALE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

export const OfficeMiniPlayerPopUp: React.FC<OfficeMiniPlayerPopUpProps> = ({
  onClose,
  onMaximize,
  targetNote: propTargetNote,
  onNextTarget,
}) => {
  const {
    officeLayout,
    officeTheme,
    officeInputMode,
    officeMaxDbThreshold,
    officeAutoMuteOnBlur,
    toleranceCents,
    isPlaying,
    isMutedMusic,
    setOfficeLayout,
    setOfficeTheme,
    setOfficeInputMode,
    setOfficeMaxDbThreshold,
    setIsPlaying,
    setIsMutedMusic,
    triggerBossKey,
    openStudio,
    closeOfficePopUp,
  } = useVocalStudioStore();

  // Internal target note sequence if not provided from parent
  const [targetIndex, setTargetIndex] = useState(0);
  const currentTargetNote = propTargetNote || SCALE_NOTES[targetIndex] || 'C4';
  const targetFreqHz = useMemo(() => getNoteFrequency(currentTargetNote), [currentTargetNote]);

  // Real-time pitch and volume tracking
  const [reading, setReading] = useState<IVocalPitchReading | null>(null);
  const [isInTune, setIsInTune] = useState(false);
  const [inTuneStreak, setInTuneStreak] = useState(0);
  const [selectedSilentKey, setSelectedSilentKey] = useState<string | null>(null);
  const [silentFeedback, setSilentFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Start microphone pitch tracker on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const startTracker = async () => {
      try {
        if (!vocalPitchService.isSupported()) return;
        await vocalPitchService.startListening();
        unsubscribe = vocalPitchService.subscribe((r) => {
          setReading(r);

          if (r.isSinging && r.clarity >= 0.5) {
            // Calculate semitone and cents diff
            const diff = (r.midiNumber - (targetFreqHz ? 12 * Math.log2(targetFreqHz / 440) + 69 : 60)) * 100;
            const inTol = Math.abs(r.centsDeviation) <= toleranceCents;
            setIsInTune(inTol);
            if (inTol) {
              setInTuneStreak((s) => s + 1);
            }
          } else {
            setIsInTune(false);
          }
        });
      } catch (err) {
        console.warn('Microphone error in office miniplayer:', err);
      }
    };

    startTracker();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [targetFreqHz, toleranceCents]);

  // Play target prompt sound softly into headphones
  const handlePlayPrompt = useCallback(() => {
    auditoryEngine.initContext();
    auditoryEngine.playNote(currentTargetNote, 1.2, {
      volume: 0.35, // Low safe volume for office headphones
      adsr: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.3 },
      timbrePreset: 'pure-sine', // Gentle tone without harsh harmonics
    });
  }, [currentTargetNote]);

  // Next target handler
  const handleNext = useCallback(() => {
    if (onNextTarget) {
      onNextTarget();
    } else {
      setTargetIndex((prev) => (prev + 1) % SCALE_NOTES.length);
    }
    setSelectedSilentKey(null);
    setSilentFeedback(null);
    setInTuneStreak(0);
    // Play new prompt
    setTimeout(() => {
      handlePlayPrompt();
    }, 150);
  }, [onNextTarget, handlePlayPrompt]);

  // Silent Keyboard choice handler
  const handleSilentKeyClick = useCallback((note: string) => {
    setSelectedSilentKey(note);
    const isCorrect = note.slice(0, -1) === currentTargetNote.slice(0, -1);
    setSilentFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setTimeout(() => {
        handleNext();
      }, 700);
    }
  }, [currentTargetNote, handleNext]);

  // Boss Key (Panic button) & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        triggerBossKey();
        if (onClose) onClose();
      }

      // Numerical keys 1-7 for silent input mode
      if (officeInputMode === 'silent-keyboard' && e.key >= '1' && e.key <= '7') {
        const note = SCALE_NOTES[parseInt(e.key, 10) - 1];
        if (note) handleSilentKeyClick(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerBossKey, onClose, officeInputMode, handleSilentKeyClick]);

  // Auto-mute on blur (Audio bleed safeguard)
  useEffect(() => {
    if (!officeAutoMuteOnBlur) return;

    const handleBlur = () => {
      setIsMutedMusic(true);
      setIsPlaying(false);
    };

    const handleFocus = () => {
      setIsMutedMusic(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [officeAutoMuteOnBlur, setIsMutedMusic, setIsPlaying]);

  const handleMaximizeClick = useCallback(() => {
    if (onMaximize) {
      onMaximize();
    } else {
      closeOfficePopUp();
      openStudio();
    }
  }, [onMaximize, closeOfficePopUp, openStudio]);

  const handleCloseClick = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      closeOfficePopUp();
    }
  }, [onClose, closeOfficePopUp]);

  // Theme styles
  const isStealth = officeTheme === 'stealth-code';
  const isRibbon = officeLayout === 'ribbon';

  return (
    <div
      className={`w-full h-full select-none flex flex-col justify-between transition-colors duration-200 ${
        isStealth
          ? 'bg-[#181818] text-[#CCCCCC] font-mono border border-[#333333]'
          : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white font-sans border border-slate-800'
      } ${isRibbon ? 'p-2' : 'p-3.5'}`}
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          {isStealth ? (
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50 shrink-0" />
          )}
          <span className="text-[11px] font-bold tracking-tight truncate max-w-[140px]">
            {isStealth ? 'SYS_PITCH_DAEMON' : 'Spotify Office Mini'}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
            {officeInputMode === 'humming' ? 'Ngân nga' : 'Bàn phím thầm'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Switch Theme (Spotify vs Stealth Code) */}
          <button
            onClick={() => setOfficeTheme(isStealth ? 'spotify' : 'stealth-code')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title={isStealth ? 'Đổi sang giao diện Spotify' : 'Ngụy trang: Giao diện VS Code / Terminal'}
          >
            {isStealth ? <Music className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
          </button>

          {/* Switch Layout (Card vs Ribbon) */}
          <button
            onClick={() => setOfficeLayout(isRibbon ? 'card' : 'ribbon')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title={isRibbon ? 'Mở rộng thẻ (Card)' : 'Thu nhỏ thanh ngang (Ribbon)'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Panic / Boss Key button */}
          <button
            onClick={() => {
              triggerBossKey();
              handleCloseClick();
            }}
            className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-[10px] flex items-center gap-1 transition active:scale-95"
            title="Boss Key (Khẩn cấp): Mute ngay lập tức và đóng cửa sổ (Phím tắt: Esc)"
          >
            <Shield className="w-3 h-3 text-red-400" />
            <span className="hidden sm:inline">Esc</span>
          </button>

          {/* Maximize to full studio */}
          <button
            onClick={handleMaximizeClick}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Mở toàn màn hình Studio"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={handleCloseClick}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Đóng cửa sổ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Ribbon Mode View (Ultra-slim 1-line layout) */}
      {isRibbon ? (
        <div className="flex items-center justify-between gap-3 py-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPrompt}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow transition active:scale-95"
              title="Nghe mẫu nốt"
            >
              <Headphones className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="text-xs font-bold font-mono text-emerald-300">{currentTargetNote}</div>
              <div className="text-[10px] text-slate-400 font-mono">{targetFreqHz.toFixed(1)} Hz</div>
            </div>
          </div>

          {/* Live Cents & Decibel Mini Pill */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {reading?.isSinging ? (
              <span className={`px-2 py-0.5 rounded ${isInTune ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'}`}>
                {reading.centsDeviation > 0 ? '+' : ''}{Math.round(reading.centsDeviation)}¢
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 italic">Đang chờ giọng...</span>
            )}
            <span className="text-[10px] text-slate-400">
              {reading?.volumeDb ? `${Math.round(reading.volumeDb + 75)}dB` : '0dB'}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition"
          >
            Nốt tiếp
          </button>
        </div>
      ) : (
        /* 3. Card Mode View (Full featured compact layout) */
        <div className="flex-1 flex flex-col justify-between py-2 gap-2">
          {/* Decibel Guard */}
          <DecibelGuardBar
            currentDb={reading?.volumeDb ?? -60}
            maxDbThreshold={officeMaxDbThreshold}
            onThresholdChange={setOfficeMaxDbThreshold}
            isMuted={isMutedMusic}
          />

          {/* Target Note Hero Card */}
          <div className={`p-2 rounded-xl flex items-center justify-between border ${
            isStealth
              ? 'bg-[#252526] border-[#3E3E42]'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-bold shadow-sm ${
                isStealth
                  ? 'bg-[#1E1E1E] text-cyan-400 border border-cyan-800'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950'
              }`}>
                <span className="text-sm leading-none">{currentTargetNote}</span>
                <span className="text-[9px] opacity-80 leading-none mt-0.5">{targetFreqHz.toFixed(0)}Hz</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Nốt Mục Tiêu</span>
                  {inTuneStreak >= 3 && (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                      🔥 x{inTuneStreak}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {officeInputMode === 'humming'
                    ? 'Ngân nga khẽ trong họng'
                    : 'Bấm phím tương ứng bên dưới'}
                </div>
              </div>
            </div>

            <button
              onClick={handlePlayPrompt}
              className={`px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                isStealth
                  ? 'bg-[#0E639C] hover:bg-[#1177BB] text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow'
              }`}
              title="Phát nốt qua tai nghe"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Nghe</span>
            </button>
          </div>

          {/* Mini Runway / Tuning Visualizer */}
          <OfficeMiniRunway
            targetNote={currentTargetNote}
            targetFreqHz={targetFreqHz}
            userFreqHz={reading?.freqHz ?? 0}
            centsDiff={reading?.centsDeviation ?? 0}
            inTolerance={isInTune}
            toleranceCents={toleranceCents}
            clarity={reading?.clarity ?? 0}
            isSinging={reading?.isSinging ?? false}
          />

          {/* Input Mode Selector & Silent Keyboard Options */}
          {officeInputMode === 'silent-keyboard' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Bàn phím thầm (Phím 1-7):</span>
                {silentFeedback === 'correct' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Chính xác!
                  </span>
                )}
                {silentFeedback === 'wrong' && (
                  <span className="text-amber-400 font-bold">Thử lại nhé</span>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {SCALE_NOTES.map((note, idx) => {
                  const isSelected = selectedSilentKey === note;
                  return (
                    <button
                      key={note}
                      onClick={() => handleSilentKeyClick(note)}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition active:scale-95 ${
                        isSelected
                          ? silentFeedback === 'correct'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-amber-500 text-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      <div>{note.slice(0, -1)}</div>
                      <div className="text-[8px] text-slate-400 font-normal">{idx + 1}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Humming Mode status cue */
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/40 text-[10px] font-mono text-slate-400 border border-slate-800">
              <span>Độ lệch: {reading?.isSinging ? `${Math.round(reading.centsDeviation)}¢` : '--'}</span>
              <span>Độ rõ: {reading?.clarity ? `${Math.round(reading.clarity * 100)}%` : '--'}</span>
              <span className={isInTune ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {isInTune ? '★ KHỚP TỐT' : 'CHỜ KHỚP'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4. Bottom Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        {/* Toggle Mode: Humming vs Silent Keyboard */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => setOfficeInputMode('humming')}
            className={`px-2 py-1 rounded text-[10px] font-medium transition ${
              officeInputMode === 'humming'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Chế độ Ngân nga khẽ vào mic"
          >
            <Mic className="w-3 h-3 inline mr-1" />
            Ngân nga
          </button>
          <button
            onClick={() => setOfficeInputMode('silent-keyboard')}
            className={`px-2 py-1 rounded text-[10px] font-medium transition ${
              officeInputMode === 'silent-keyboard'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Chế độ Bàn phím thầm (Không cần mic)"
          >
            <Keyboard className="w-3 h-3 inline mr-1" />
            Phím thầm
          </button>
        </div>

        {/* Right Buttons: Replay & Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPrompt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Nghe lại nốt"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer ${
              isStealth
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                : 'bg-white hover:bg-slate-200 text-black'
            }`}
          >
            <span>Nốt tiếp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
