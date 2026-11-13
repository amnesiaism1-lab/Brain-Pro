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
    toggleOfficeMode,
    togglePauseOfficeMode,
    setPitchRecallInputRule,
    closeOfficePopUp,
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
  const [isRibbon, setIsRibbon] = useState<boolean>(false);

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

  const handleMaximize = useCallback(() => {
    closeOfficePopUp();
    setSelectedExerciseSlug('pitch-recall');
    setActiveTab('exercises');
    if (onMaximize) onMaximize();
  }, [closeOfficePopUp, setSelectedExerciseSlug, setActiveTab, onMaximize]);

  const containerRef = useRef<HTMLDivElement>(null);

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
        if (keyLower === 'q') {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
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
  ]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`w-full h-full select-none flex flex-col justify-between transition-colors duration-200 overflow-hidden outline-none ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-800'
          : 'bg-slate-50 text-slate-800 border border-slate-300 shadow-2xl'
      } ${isRibbon ? 'p-2' : 'p-3'}`}
    >
      {/* 1. Header Mini */}
      <div
        className={`flex items-center justify-between gap-1 pb-1.5 border-b text-xs ${
          isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-xs">
              Brain Pro • Nhớ Cao Độ
            </span>
            {currentOfficeQuestion && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                Cấp {currentOfficeQuestion.level}
              </span>
            )}
          </div>
          {officeSession.currentStreak >= 2 && (
            <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center gap-0.5">
              🔥 x{officeSession.currentStreak}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
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

          {/* Layout Toggle (Card vs Ribbon) */}
          <button
            onClick={() => setIsRibbon((r) => !r)}
            className={`p-1 rounded hover:bg-slate-800/80 transition ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
            }`}
            title={isRibbon ? 'Mở rộng thẻ (Card)' : 'Thu nhỏ thanh dẹt (Ribbon)'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Boss Key (Panic button) */}
          <button
            onClick={handleClose}
            className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
            title="Boss Key (Khẩn cấp): Ẩn pop-up ngay lập tức (Phím tắt: Esc hoặc Alt+Q)"
          >
            <Shield className="w-3 h-3 text-red-400" />
            <span>Esc</span>
          </button>

          {/* Maximize */}
          <button
            onClick={handleMaximize}
            className={`p-1 rounded hover:bg-slate-800/80 transition ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
            }`}
            title="Mở toàn màn hình bài tập Nhớ Cao Độ"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className={`p-1 rounded hover:bg-slate-800/80 transition ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
            }`}
            title="Đóng cửa sổ Pop-up (Alt+Q)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Ribbon Mode View (Ultra-slim 1-line dock) */}
      {isRibbon ? (
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow transition active:scale-95"
              title="Nghe lại chuỗi nốt (Alt+R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="text-xs font-bold text-emerald-400">
                {officeQuestionState === 'waiting'
                  ? `Nhớ chuỗi ${requiredCount} nốt`
                  : officeQuestionState === 'playing'
                  ? 'Đang phát âm...'
                  : formatTimer(secondsUntilNext)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {userRecallSequence.length > 0
                  ? sequenceToSolfege(userRecallSequence)
                  : 'Gõ phím 1-7 để trả lời'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNextOrSkip}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95"
            >
              Tiếp tục (Alt+N)
            </button>
          </div>
        </div>
      ) : (
        /* 3. Card Mode View */
        <div className="flex-1 flex flex-col justify-between py-2 gap-2">
          {/* TRẠNG THÁI A: ĐANG CÓ BÀI TẬP (waiting hoặc playing) */}
          {officeQuestionState === 'waiting' || officeQuestionState === 'playing' ? (
            <div className="space-y-2">
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
              <div className="flex items-center justify-center gap-2 py-1">
                {Array.from({ length: requiredCount }).map((_, idx) => {
                  const inputNote = userRecallSequence[idx];
                  const isCurrent = idx === userRecallSequence.length;
                  return (
                    <div
                      key={idx}
                      className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center border font-mono transition-all duration-150 ${
                        inputNote
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold scale-105'
                          : isCurrent
                          ? 'bg-slate-800/80 border-indigo-400 text-indigo-300 animate-pulse'
                          : 'bg-slate-900/50 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400">Nốt {idx + 1}</span>
                      <span className="text-sm font-black">
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
                  <span>Bàn phím nhập nốt (Bấm hoặc gõ phím 1-7):</span>
                  <span className="text-emerald-400">Tai nghe êm ái</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {keys.slice(0, 7).map((k) => (
                    <button
                      key={k.key}
                      onClick={() => handleInputNote(k.note)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-100 hover:text-white border border-slate-700/80 font-mono text-xs font-bold flex flex-col items-center justify-center transition active:scale-95 cursor-pointer hover:shadow-md"
                      title={`Gõ phím ${k.key} hoặc click để nhập nốt ${k.solfege}`}
                    >
                      <span className="text-sm">{k.solfege}</span>
                      <span className="text-[9px] text-slate-400 font-normal">{k.key}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : officeQuestionState === 'freestyle' && lastOfficeAnswerResult ? (
            /* TRẠNG THÁI B: TRẢ LỜI SAI & FREESTYLE ĐỐI CHIẾU */
            <div className="space-y-2 animate-fade-in text-center py-2">
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
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
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
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nghe lại (Alt+R)</span>
                </button>
                <button
                  onClick={handleNextOrSkip}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/30"
                >
                  <span>Câu kế tiếp (Alt+N)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* TRẠNG THÁI C: CHỜ ĐẾM NGƯỢC (STANDBY) */
            <div className="my-auto text-center space-y-3 py-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50">
                <Music className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Chế độ Nhớ Cao Độ Văn Phòng</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Luyện thính giác định kỳ qua tai nghe không làm gián đoạn công việc
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="font-mono text-xs text-slate-300 bg-slate-800/60 rounded-xl py-2 px-3 inline-flex items-center gap-2 border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Câu tiếp theo sau:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatTimer(secondsUntilNext)}
                </span>
              </div>

              {/* Instant Next Question Button */}
              <div>
                <button
                  onClick={handleNextOrSkip}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Luyện tập ngay bây giờ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Footer */}
      <div
        className={`flex items-center justify-between pt-1.5 border-t text-[11px] ${
          isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <span className="font-mono">
          Alt+Q: Bật/Tắt • Esc: Thoát
        </span>
        <span className="font-mono">
          Đã làm: {officeSession.totalAnswered} • Đúng: {officeSession.correctCount}
        </span>
      </div>
    </div>
  );
};
