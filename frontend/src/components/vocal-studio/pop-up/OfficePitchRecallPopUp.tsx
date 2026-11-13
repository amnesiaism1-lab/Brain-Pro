import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { useOfficeMode } from '../../../hooks/useOfficeMode';
import {
  getKeyDefinitionsForRule,
  PitchRecallInputRule,
  RULE_INFO_MAP,
  noteToSolfege,
  sequenceToSolfege,
  mapKeyToNote,
} from '../../../services/pitchRecallKeyMap';
import {
  Headphones,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Maximize2,
  X,
  Shield,
  Layers,
  Sun,
  Moon,
  Sliders,
  Delete,
  Music,
  Minus,
  Square,
  Copy,
} from 'lucide-react';

interface OfficePitchRecallPopUpProps {
  onClose?: () => void;
  onMaximize?: () => void;
}

export const OfficePitchRecallPopUp: React.FC<OfficePitchRecallPopUpProps> = ({
  onClose,
  onMaximize,
}) => {
  const {
    officeModeActive,
    officeModePaused,
    officeSettings,
    currentOfficeQuestion,
    officeQuestionState,
    lastOfficeAnswerResult,
    officeSession,
    secondsUntilNext,
    isOfficePopUpMinimized,
    officePopUpSize,
    toggleOfficeMode,
    togglePauseOfficeMode,
    setPitchRecallInputRule,
    closeOfficePopUp,
    minimizeOfficePopUp,
    restoreOfficePopUp,
    toggleOfficePopUpMinimize,
    setOfficePopUpSize,
    setEarbudProfile,
    swapEarbudActions,
    setSelectedExerciseSlug,
    setActiveTab,
  } = useAppStore();

  const {
    handleReplay,
    handleInputNote,
    handleBackspaceNote,
    handleClearSequence,
    handleFreestylePlayNote,
    handleNextOrSkip,
    userRecallSequence,
  } = useOfficeMode();

  // Theme: Spotify Dark (default) vs Soft Light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Resize listener for Document PiP OS window compatibility
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 380,
    height: typeof window !== 'undefined' ? window.innerHeight : 390,
  });

  useEffect(() => {
    const ownerDoc = containerRef.current?.ownerDocument || document;
    const targetWin = ownerDoc.defaultView || window;

    const updateDimensions = () => {
      setWindowDimensions({
        width: targetWin.innerWidth || ownerDoc.documentElement.clientWidth || 380,
        height: targetWin.innerHeight || ownerDoc.documentElement.clientHeight || 390,
      });
    };

    updateDimensions();
    targetWin.addEventListener('resize', updateDimensions);
    return () => {
      targetWin.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const isCompact = isOfficePopUpMinimized || windowDimensions.height < 140;

  const currentRule = officeSettings.pitchRecallInputRule || 'scale-degrees';
  const ruleInfo = RULE_INFO_MAP[currentRule];
  const keys = useMemo(() => getKeyDefinitionsForRule(currentRule), [currentRule]);

  const targetSeq = currentOfficeQuestion?.sequenceNotes || [];
  const requiredCount = targetSeq.length || 3;

  const cycleInputRule = useCallback(() => {
    const rules: PitchRecallInputRule[] = ['scale-degrees', 'piano-keys', 'note-letters', 'multiple-choice'];
    const currentIdx = rules.indexOf(currentRule);
    const nextRule = rules[(currentIdx + 1) % rules.length];
    setPitchRecallInputRule(nextRule);
  }, [currentRule, setPitchRecallInputRule]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleClose = useCallback(() => {
    closeOfficePopUp();
    if (onClose) onClose();
  }, [closeOfficePopUp, onClose]);

  const handleToggleSize = useCallback(() => {
    if (isCompact) {
      restoreOfficePopUp();
      return;
    }
    const nextSize = officePopUpSize === 'expanded' ? 'standard' : 'expanded';
    setOfficePopUpSize(nextSize);
  }, [isCompact, officePopUpSize, restoreOfficePopUp, setOfficePopUpSize]);

  const handleMaximize = useCallback(() => {
    closeOfficePopUp();
    setSelectedExerciseSlug('pitch-recall');
    setActiveTab('exercises');
    if (onMaximize) onMaximize();
  }, [closeOfficePopUp, setSelectedExerciseSlug, setActiveTab, onMaximize]);

  // Keyboard handler for Document PiP window when focused
  useEffect(() => {
    const ownerDoc = containerRef.current?.ownerDocument || document;
    const targetWin = ownerDoc.defaultView || window;

    const handlePopUpKeyDown = (e: KeyboardEvent) => {
      const activeEl = ownerDoc.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;
      if (isInput) return;

      const keyLower = e.key.toLowerCase();

      // Escape: Boss key - Instant Close Pop-up
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Alt key combos
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        // Alt + Q: Thu nhỏ (—) hoặc Khôi phục (Restore) - KHÔNG ĐÓNG HẲN CỬA SỔ
        if (keyLower === 'q') {
          e.preventDefault();
          e.stopPropagation();
          toggleOfficePopUpMinimize();
          return;
        }
        if (keyLower === 'r') {
          e.preventDefault();
          e.stopPropagation();
          handleReplay();
          return;
        }
        if (keyLower === 'n') {
          e.preventDefault();
          e.stopPropagation();
          handleNextOrSkip();
          return;
        }
      }

      // Minus '-' or '_': Thu nhỏ như dấu trừ
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        e.stopPropagation();
        toggleOfficePopUpMinimize();
        return;
      }

      // Backspace: delete last note in recall sequence
      if (e.key === 'Backspace') {
        if (officeQuestionState === 'waiting') {
          e.preventDefault();
          e.stopPropagation();
          handleBackspaceNote();
          return;
        }
      }

      // Space / Enter: next question if freestyle or standby
      if (e.key === 'Enter' || e.code === 'Space') {
        if (officeQuestionState === 'freestyle' || officeQuestionState === 'standby') {
          e.preventDefault();
          e.stopPropagation();
          handleNextOrSkip();
          return;
        }
      }

      // Note input keys (1-7 / Piano A-K / C-B depending on rule)
      if (officeQuestionState === 'waiting') {
        const mappedNote = mapKeyToNote(e.key, currentRule);
        if (mappedNote) {
          e.preventDefault();
          e.stopPropagation();
          handleInputNote(mappedNote);
        }
      }
    };

    targetWin.addEventListener('keydown', handlePopUpKeyDown);
    return () => {
      targetWin.removeEventListener('keydown', handlePopUpKeyDown);
    };
  }, [
    currentRule,
    officeQuestionState,
    handleClose,
    handleReplay,
    handleNextOrSkip,
    handleBackspaceNote,
    handleInputNote,
    toggleOfficePopUpMinimize,
  ]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`w-full h-full select-none flex flex-col justify-between transition-colors duration-200 overflow-hidden outline-none font-sans ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-800'
          : 'bg-slate-50 text-slate-800 border border-slate-300 shadow-2xl'
      } ${isCompact ? 'p-1.5 justify-center' : 'p-3'}`}
    >
      {/* =========================================================================
          CHẾ ĐỘ THU NHỎ DẤU TRỪ (MINIMIZED COMPACT RIBBON BAR - 70px Height)
          ========================================================================= */}
      {isCompact ? (
        <div className="w-full h-full flex items-center justify-between gap-2 px-1">
          {/* Left: Mini Play/Replay & Solfege Badges */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleReplay}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition active:scale-95 cursor-pointer shrink-0"
              title="Nghe lại chuỗi nốt (Alt+R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="truncate">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 leading-tight">
                <span className="truncate">
                  {officeQuestionState === 'waiting'
                    ? `Nhớ ${requiredCount} nốt:`
                    : officeQuestionState === 'playing'
                    ? 'Đang phát âm...'
                    : officeQuestionState === 'freestyle'
                    ? 'Đối chiếu âm'
                    : `Chờ: ${formatTimer(secondsUntilNext)}`}
                </span>
                {officeSession.currentStreak >= 2 && (
                  <span className="text-[9px] text-amber-400 font-mono font-bold">
                    🔥{officeSession.currentStreak}
                  </span>
                )}
              </div>

              {/* Solfege sequence or hint */}
              <div className="text-[10px] text-slate-300 font-mono font-bold truncate mt-0.5">
                {userRecallSequence.length > 0 ? (
                  <span className="text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-500/40">
                    {sequenceToSolfege(userRecallSequence)}
                  </span>
                ) : officeQuestionState === 'waiting' ? (
                  <span className="text-slate-400">Gõ phím 1-7 để điền nốt</span>
                ) : (
                  <span className="text-slate-400">Bấm Alt+N để luyện</span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Mini 1-7 Quick Piano Buttons when waiting */}
          {officeQuestionState === 'waiting' && windowDimensions.width >= 350 && (
            <div className="hidden sm:flex items-center gap-0.5">
              {keys.slice(0, 7).map((k) => (
                <button
                  key={k.key}
                  onClick={() => handleInputNote(k.note)}
                  className="px-1.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 text-[10px] font-mono font-bold transition active:scale-90 cursor-pointer"
                  title={`Gõ ${k.key} hoặc click: ${k.solfege}`}
                >
                  {k.key}
                </button>
              ))}
            </div>
          )}

          {/* Right: Window Controls Trio (— 🗖 ✕) */}
          <div className="flex items-center gap-1 shrink-0">
            {officeQuestionState !== 'waiting' && (
              <button
                onClick={handleNextOrSkip}
                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition active:scale-95 cursor-pointer mr-1"
                title="Bỏ qua / Luyện tiếp (Alt+N)"
              >
                {officeQuestionState === 'standby' ? 'Luyện' : 'Tiếp'}
              </button>
            )}

            {/* Quick Earbud Swap in Ribbon Mode */}
            <button
              onClick={() => {
                const currentProf = officeSettings.earbudProfile || 'right-hand';
                setEarbudProfile(currentProf === 'right-hand' ? 'left-hand' : 'right-hand');
              }}
              className="px-1.5 py-1 rounded-lg text-[10px] font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer mr-0.5"
              title={`Đang ưu tiên ${officeSettings.earbudProfile === 'left-hand' ? 'Tai Trái (L)' : 'Tai Phải (R)'}. Click để đổi.`}
            >
              {officeSettings.earbudProfile === 'left-hand' ? '🎧L' : '🎧R'}
            </button>

            {/* Window Controls Trio matching user's image */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
              {/* Minimize / Restore button (—) */}
              <button
                onClick={toggleOfficePopUpMinimize}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Mở rộng / Khôi phục thẻ (Alt+Q)"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Maximize / Restore button (🗖) */}
              <button
                onClick={handleToggleSize}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Khôi phục kích thước chuẩn (380x390)"
              >
                <Square className="w-3 h-3 stroke-[2]" />
              </button>

              {/* Close button (✕) */}
              <button
                onClick={handleClose}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
                title="Đóng hẳn cửa sổ (Esc)"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            CHẾ ĐỘ THẺ CHUẨN / MỞ RỘNG (CARD FULL PRACTICE MODE)
            ========================================================================= */
        <>
          {/* 1. Header with Window Control Trio */}
          <div
            className={`flex items-center justify-between gap-1 pb-1.5 border-b text-xs ${
              isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="font-bold tracking-tight text-xs truncate">
                  Brain Pro • Nhớ Cao Độ
                </span>
                {currentOfficeQuestion && (
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                    Cấp {currentOfficeQuestion.level}
                  </span>
                )}
              </div>
              {officeSession.currentStreak >= 2 && (
                <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center gap-0.5 shrink-0">
                  🔥 x{officeSession.currentStreak}
                </span>
              )}
            </div>

            {/* Titlebar Action icons + Window Controls Trio */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Cycle rule */}
              <button
                onClick={cycleInputRule}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                }`}
                title={`Quy tắc phím: ${ruleInfo.name}. Bấm để đổi`}
              >
                <Layers className="w-2.5 h-2.5 inline mr-1 text-emerald-400" />
                <span>{ruleInfo.shortName}</span>
              </button>

              {/* Earbud Profile Quick Switch */}
              <button
                onClick={() => {
                  const currentProf = officeSettings.earbudProfile || 'right-hand';
                  setEarbudProfile(currentProf === 'right-hand' ? 'left-hand' : 'right-hand');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition flex items-center gap-1 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                }`}
                title={`Cảm ứng tai nghe: ${
                  officeSettings.earbudProfile === 'left-hand'
                    ? 'Đang ưu tiên TAI TRÁI (Trái 2x: Tiếp tục, Phải 2x: Nghe lại). Click để đổi sang TAI PHẢI'
                    : 'Đang ưu tiên TAI PHẢI (Phải 2x: Tiếp tục, Trái 2x: Nghe lại). Click để đổi sang TAI TRÁI'
                }`}
              >
                <span>{officeSettings.earbudProfile === 'left-hand' ? '🎧 Trái' : '🎧 Phải'}</span>
              </button>

              {/* Toggle Theme */}
              <button
                onClick={() => setIsDarkMode((d) => !d)}
                className={`p-1 rounded hover:bg-slate-800/80 transition ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
                title={isDarkMode ? 'Đổi sang giao diện sáng dịu' : 'Đổi sang giao diện tối Spotify'}
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* =========================================================================
                  WINDOW CONTROLS TRIO (— 🗖 ✕) EXACTLY MATCHING USER SCREENSHOT
                  ========================================================================= */}
              <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 ml-1">
                {/* 1. Minimize button (—) */}
                <button
                  onClick={minimizeOfficePopUp}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Thu nhỏ như dấu trừ (Alt+Q hoặc phím -)"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* 2. Maximize / Restore button (🗖) */}
                <button
                  onClick={handleToggleSize}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                  title={
                    officePopUpSize === 'expanded'
                      ? 'Thu về kích thước chuẩn (380x390)'
                      : 'Phóng lớn cửa sổ (440x480)'
                  }
                >
                  {officePopUpSize === 'expanded' ? (
                    <Copy className="w-3 h-3 stroke-[2]" />
                  ) : (
                    <Square className="w-3 h-3 stroke-[2]" />
                  )}
                </button>

                {/* 3. Close button (✕) */}
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Đóng hẳn cửa sổ (Phím Esc)"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Main Practice Card Body (Scrollable for responsive safety) */}
          <div className="flex-1 overflow-y-auto px-0.5 py-2 flex flex-col justify-between gap-2">
            {/* TRẠNG THÁI A: ĐANG CÓ BÀI TẬP (waiting hoặc playing) */}
            {officeQuestionState === 'waiting' || officeQuestionState === 'playing' ? (
              <div className="space-y-2 my-auto">
                {/* Guidance header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    {officeQuestionState === 'playing'
                      ? '🎵 Đang phát chuỗi nốt qua tai nghe...'
                      : `Lắng nghe & gõ lại chuỗi ${requiredCount} nốt:`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {userRecallSequence.length}/{requiredCount} nốt
                  </span>
                </div>

                {/* Sequence Display Slots */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1">
                  {Array.from({ length: requiredCount }).map((_, idx) => {
                    const inputNote = userRecallSequence[idx];
                    const isCurrent = idx === userRecallSequence.length;
                    return (
                      <div
                        key={idx}
                        className={`w-12 sm:w-14 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center border font-mono transition-all duration-150 ${
                          inputNote
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold scale-105 shadow-sm'
                            : isCurrent
                            ? 'bg-slate-800/80 border-indigo-400 text-indigo-300 animate-pulse'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="text-[8px] sm:text-[9px] text-slate-400">Nốt {idx + 1}</span>
                        <span className="text-xs sm:text-sm font-black">
                          {inputNote ? noteToSolfege(inputNote) : isCurrent ? '_' : '•'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Audio Controls row */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleReplay}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                    title="Nghe lại chuỗi nốt (Alt+R)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nghe lại (Alt+R)</span>
                  </button>

                  {userRecallSequence.length > 0 && (
                    <button
                      onClick={handleBackspaceNote}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Xóa nốt vừa gõ (Backspace)"
                    >
                      <Delete className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}

                  <button
                    onClick={handleNextOrSkip}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm shadow-indigo-600/30"
                    title="Bỏ qua hoặc sang câu kế tiếp (Alt+N)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Bỏ qua</span>
                  </button>
                </div>

                {/* Interactive Virtual Keyboard for Silent Note Input */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Bàn phím nhập nốt (Gõ 1-7 hoặc click):</span>
                    <span className="text-emerald-400">Tai nghe êm ái</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {keys.slice(0, 7).map((k) => (
                      <button
                        key={k.key}
                        onClick={() => handleInputNote(k.note)}
                        className="py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-100 hover:text-white border border-slate-700/80 font-mono text-xs font-bold flex flex-col items-center justify-center transition active:scale-95 cursor-pointer hover:shadow-md"
                        title={`Gõ phím ${k.key} hoặc click để nhập nốt ${k.solfege}`}
                      >
                        <span className="text-xs sm:text-sm">{k.solfege}</span>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal">{k.key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : officeQuestionState === 'freestyle' && lastOfficeAnswerResult ? (
              /* TRẠNG THÁI B: TRẢ LỜI SAI & FREESTYLE ĐỐI CHIẾU */
              <div className="space-y-2 animate-fade-in text-center my-auto py-1">
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs">
                  <div className="font-bold text-rose-400 flex items-center justify-center gap-1.5 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span>Chưa chính xác — Hãy nghe đối chiếu:</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-xs font-mono">
                    <span className="line-through text-slate-400">
                      Bạn gõ: {lastOfficeAnswerResult.selectedLabel}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Đáp án: {lastOfficeAnswerResult.correctLabel}
                    </span>
                  </div>
                </div>

                {/* Sequence comparison */}
                {lastOfficeAnswerResult.sequenceNotes && (
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {lastOfficeAnswerResult.sequenceNotes.map((targetNote, idx) => {
                      const userNote = lastOfficeAnswerResult.userNotes?.[idx];
                      const isMatch = userNote === targetNote;
                      return (
                        <div
                          key={idx}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                            isMatch
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-500 text-rose-300'
                          }`}
                        >
                          <div>{noteToSolfege(targetNote)}</div>
                          <div className="text-[8px] text-slate-400">
                            {isMatch ? '✓ Đúng' : `✕ (${userNote ? noteToSolfege(userNote) : 'thiếu'})`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleReplay}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nghe lại (Alt+R)</span>
                  </button>
                  <button
                    onClick={handleNextOrSkip}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <span>Câu kế tiếp (Alt+N)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* TRẠNG THÁI C: CHỜ ĐẾM NGƯỢC (STANDBY) */
              <div className="my-auto text-center space-y-2.5 py-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Chế độ Nhớ Cao Độ Văn Phòng</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Luyện thính giác định kỳ qua tai nghe không làm gián đoạn công việc
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="font-mono text-xs text-slate-300 bg-slate-800/60 rounded-xl py-1.5 px-3 inline-flex items-center gap-2 border border-slate-700/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Câu tiếp theo sau:</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    {formatTimer(secondsUntilNext)}
                  </span>
                </div>

                {/* Instant Next Question Button */}
                <div>
                  <button
                    onClick={handleNextOrSkip}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Luyện tập ngay bây giờ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer */}
          <div
            className={`flex items-center justify-between pt-1.5 border-t text-[10px] font-mono ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span>
              Alt+Q: Thu nhỏ (—) • Esc: Thoát
            </span>
            <span>
              Đã làm: {officeSession.totalAnswered} • Đúng: {officeSession.correctCount}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
