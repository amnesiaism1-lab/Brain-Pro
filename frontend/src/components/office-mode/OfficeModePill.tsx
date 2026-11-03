import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useOfficeMode } from '../../hooks/useOfficeMode';
import {
  getKeyDefinitionsForRule,
  PitchRecallInputRule,
  RULE_INFO_MAP,
  noteToSolfege
} from '../../services/pitchRecallKeyMap';
import {
  Headphones,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  Info,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Music2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Layers
} from 'lucide-react';

const STORAGE_KEY_POS = 'be_office_pill_coords';

export const OfficeModePill: React.FC = () => {
  const {
    officeModeActive,
    officeModePaused,
    officeSettings,
    currentOfficeQuestion,
    officeQuestionState,
    lastOfficeAnswerResult,
    officeSession,
    secondsUntilNext,
    togglePauseOfficeMode,
    toggleInfoPanel,
    setPitchRecallInputRule
  } = useAppStore();

  const {
    handleReplay,
    handleAnswer,
    handleInputNote,
    handleBackspaceNote,
    handleClearSequence,
    handleFreestylePlayNote,
    handleFreestylePlayOption,
    handleNextOrSkip,
    userRecallSequence
  } = useOfficeMode();

  // Tọa độ tùy chỉnh khi người dùng kéo thả tự do
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isTopFlipped, setIsTopFlipped] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Kéo thả tự do bằng chuột / cảm ứng (Pointer Events)
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top
    };

    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const width = containerRef.current.offsetWidth || 300;
    const height = containerRef.current.offsetHeight || 50;

    const maxX = Math.max(10, window.innerWidth - width - 10);
    const maxY = Math.max(10, window.innerHeight - height - 10);

    const newX = Math.max(10, Math.min(maxX, dragStartRef.current.initX + deltaX));
    const newY = Math.max(10, Math.min(maxY, dragStartRef.current.initY + deltaY));

    setDragPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {}

    if (dragPos && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(dragPos));
      } catch {}
    }
  };

  // Nút nhanh đẩy thanh Lên trên / Xuống dưới
  const toggleQuickVerticalPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragPos) {
      setDragPos(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_POS);
      }
    }
    setIsTopFlipped(prev => !prev);
  };

  // Đổi nhanh quy tắc bàn phím
  const cycleInputRule = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rules: PitchRecallInputRule[] = ['scale-degrees', 'piano-keys', 'note-letters', 'multiple-choice'];
    const currentIdx = rules.indexOf(officeSettings.pitchRecallInputRule || 'scale-degrees');
    const nextRule = rules[(currentIdx + 1) % rules.length];
    setPitchRecallInputRule(nextRule);
  };

  if (!officeSettings.showPill) {
    return null;
  }

  // Vị trí mặc định: ĐÃ ĐẨY LÊN CAO (bottom-28 ~112px) để không che nút chính
  const defaultPositionClasses = isTopFlipped
    ? 'top-20 right-6'
    : {
        'bottom-right': 'bottom-28 sm:bottom-32 right-6',
        'bottom-left': 'bottom-28 sm:bottom-32 left-6',
        'top-right': 'top-20 right-6',
        'top-left': 'top-20 left-6'
      }[officeSettings.pillPosition || 'bottom-right'];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentRule = officeSettings.pitchRecallInputRule || 'scale-degrees';
  const ruleInfo = RULE_INFO_MAP[currentRule];
  const isPitchRecall = currentOfficeQuestion?.exerciseSlug === 'pitch-recall';

  // NẾU OFFICE MODE ĐANG TẮT: Mini launcher nhỏ gọn
  if (!officeModeActive) {
    return (
      <aside
        role="region"
        aria-label="Khởi động Chế độ Văn phòng"
        style={dragPos ? { left: `${dragPos.x}px`, top: `${dragPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
        className={`fixed ${!dragPos ? defaultPositionClasses : ''} z-40 transition-all duration-200 animate-fade-in select-none`}
      >
        <button
          onClick={() => toggleInfoPanel(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/80 shadow-xl backdrop-blur-md text-xs font-bold transition-all cursor-pointer group hover:scale-105 active:scale-95"
          title="Nhấn để mở Bảng điều khiển & Hướng dẫn (Alt+Q để bật)"
        >
          <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:text-indigo-300">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span>Chế độ Văn phòng</span>
          <kbd className="px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-600 rounded text-[9px] font-mono">
            Alt+Q
          </kbd>
        </button>
      </aside>
    );
  }

  return (
    <aside
      ref={containerRef}
      role="region"
      aria-label="Chế độ văn phòng - Luyện tai ngầm"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={dragPos ? { left: `${dragPos.x}px`, top: `${dragPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
      className={`fixed ${!dragPos ? defaultPositionClasses : ''} z-40 transition-shadow duration-200 animate-fade-in select-none touch-none max-w-full`}
    >
      <div
        className={`flex flex-col gap-2 p-3 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
          officeQuestionState === 'freestyle'
            ? 'bg-slate-900/98 text-white border-amber-500/70 shadow-amber-500/25 max-w-md'
            : officeQuestionState === 'feedback'
            ? lastOfficeAnswerResult?.isCorrect
              ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-500/20'
              : 'bg-rose-600/95 text-white border-rose-400 shadow-rose-500/20'
            : officeModePaused
            ? 'bg-amber-600/95 text-white border-amber-400/50 shadow-amber-500/20'
            : officeQuestionState === 'playing'
            ? 'bg-indigo-600/95 text-white border-indigo-400/50 shadow-indigo-500/20 animate-pulse'
            : officeQuestionState === 'waiting'
            ? 'bg-slate-900/95 text-white border-indigo-500/60 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
            : 'bg-slate-900/90 text-white border-slate-700/80 shadow-black/40 hover:border-slate-500'
        }`}
      >
        {/* 1. Trạng thái: FREESTYLE REVIEW (Ôn tập & Thử nghiệm tự do khi trả lời sai) */}
        {officeQuestionState === 'freestyle' && lastOfficeAnswerResult && currentOfficeQuestion ? (
          <div className="space-y-2.5 animate-scale-up text-left">
            {/* Header: Tay cầm kéo thả + Đối chiếu Sai vs Đúng */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-2">
              <div className="flex items-start gap-1.5">
                <div
                  className="p-1 -ml-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0"
                  title="Kéo thả để di chuyển thanh tự do trên màn hình"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-through">{lastOfficeAnswerResult.selectedLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-black text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Đúng: {lastOfficeAnswerResult.correctLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleQuickVerticalPosition}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isTopFlipped || (dragPos && dragPos.y < 200) ? 'Đẩy xuống dưới' : 'Đẩy lên trên'}
                >
                  {isTopFlipped || (dragPos && dragPos.y < 200) ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>

                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Freestyle
                </span>
              </div>
            </div>

            {/* Chi tiết từng nốt đối chiếu (Nếu là bài Nhớ Cao Độ) */}
            {isPitchRecall && lastOfficeAnswerResult.sequenceNotes && (
              <div className="flex items-center gap-1.5 py-1 overflow-x-auto">
                {lastOfficeAnswerResult.sequenceNotes.map((targetNote, idx) => {
                  const userNote = lastOfficeAnswerResult.userNotes?.[idx];
                  const isSlotCorrect = userNote === targetNote;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center px-2 py-1 rounded-xl border text-xs font-mono font-bold min-w-[2.6rem] ${
                        isSlotCorrect
                          ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-500/70 text-rose-300'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400">Nốt {idx + 1}</span>
                      <span className="text-xs font-black">{noteToSolfege(targetNote)}</span>
                      {!isSlotCorrect && (
                        <span className="text-[9px] line-through text-rose-400">
                          {userNote ? noteToSolfege(userNote) : '?'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mẹo nhận diện */}
            {(lastOfficeAnswerResult.mnemonicSongVi || lastOfficeAnswerResult.tipVi) && (
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {lastOfficeAnswerResult.mnemonicSongVi || lastOfficeAnswerResult.tipVi}
                </span>
              </div>
            )}

            {/* Bàn phím thử nghiệm tự do */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">
                {isPitchRecall && currentRule !== 'multiple-choice'
                  ? `Bấm phím (${ruleInfo.hotkeyGuide}) hoặc click để nghe thử đối chiếu:`
                  : `Bấm phím 1..${currentOfficeQuestion.options.length} hoặc click để nghe thử tự do:`}
              </span>

              {isPitchRecall && currentRule !== 'multiple-choice' ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {getKeyDefinitionsForRule(currentRule).map((k) => (
                    <button
                      key={k.key}
                      onClick={() => handleFreestylePlayNote(k.note)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        k.isBlack
                          ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-amber-300'
                          : 'bg-slate-800 hover:bg-indigo-600 border-slate-700 text-slate-200 hover:text-white'
                      }`}
                      title={`Bấm phím ${k.key} để nghe`}
                    >
                      <span className="font-mono text-indigo-400">{k.key}</span>
                      <span>{k.solfege}</span>
                      <Music2 className="w-2.5 h-2.5 opacity-50 ml-0.5" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {currentOfficeQuestion.options.map((opt) => (
                    <button
                      key={opt.index}
                      onClick={() => handleFreestylePlayOption(opt.index)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        opt.isCorrect
                          ? 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                          : opt.index === lastOfficeAnswerResult.selectedIndex
                          ? 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/60 text-rose-300'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title={`Bấm phím ${opt.index} để nghe`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center font-mono font-bold shrink-0">
                          {opt.index}
                        </span>
                        <span className="truncate">{opt.label || opt.code}</span>
                      </span>
                      <Music2 className="w-3 h-3 opacity-60 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-800">
              <button
                onClick={handleReplay}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Nghe lại đề bài (Alt+R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nghe lại (Alt+R)</span>
              </button>

              <button
                onClick={handleNextOrSkip}
                className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
                title="Chuyển sang câu tiếp theo (Alt+N hoặc Enter/Space)"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <kbd className="px-1 bg-indigo-700 rounded text-[9px] font-mono">Alt+N</kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Tay cầm kéo thả (Grip Handle) */}
            <div
              className="p-1 -ml-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0"
              title="Kéo thả để di chuyển thanh tự do trên màn hình"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* 2. Trạng thái: FEEDBACK ĐÚNG */}
            {officeQuestionState === 'feedback' && lastOfficeAnswerResult && (
              <div className="flex items-center gap-2 text-xs font-bold animate-scale-up">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{lastOfficeAnswerResult.correctLabel}</span>
                {lastOfficeAnswerResult.awardedXp > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/40 text-[10px] text-emerald-100 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{lastOfficeAnswerResult.awardedXp} XP
                  </span>
                )}
              </div>
            )}

            {/* 3. Trạng thái: PAUSED */}
            {officeModePaused && (
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-amber-200 animate-pulse" />
                <span className="text-xs font-bold text-amber-100">Đang tạm dừng</span>
                <button
                  onClick={togglePauseOfficeMode}
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Tiếp tục (Alt+P)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            )}

            {/* 4. Trạng thái: PLAYING AUDIO */}
            {!officeModePaused && officeQuestionState === 'playing' && (
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-200 animate-bounce" />
                <span className="text-xs font-bold text-indigo-100">
                  {isPitchRecall ? `Đang phát ${currentOfficeQuestion?.sequenceNotes?.length || 3} nốt...` : 'Đang phát âm thanh...'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-indigo-200 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-indigo-100 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-indigo-300 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}

            {/* 5. Trạng thái: WAITING FOR ANSWER */}
            {!officeModePaused && officeQuestionState === 'waiting' && currentOfficeQuestion && (
              <div className="flex items-center gap-2">
                {/* Level badge */}
                <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800">
                  Cấp {currentOfficeQuestion.level}
                </span>

                {/* Nhớ Cao Độ với Quy tắc Bàn Phím (Bậc âm, Piano, Ký âm chữ cái) */}
                {isPitchRecall && currentRule !== 'multiple-choice' ? (
                  <div className="flex items-center gap-2">
                    {/* Tiến độ nhập nốt (Slots) */}
                    <div className="flex items-center gap-1">
                      {currentOfficeQuestion.sequenceNotes?.map((_, idx) => {
                        const note = userRecallSequence[idx];
                        const isCurrentSlot = idx === userRecallSequence.length;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold min-w-[1.8rem] border transition-all ${
                              note
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/40'
                                : isCurrentSlot
                                ? 'bg-slate-800 border-indigo-500/80 text-indigo-300 ring-2 ring-indigo-500/30 animate-pulse'
                                : 'bg-slate-850 border-slate-700 text-slate-500'
                            }`}
                          >
                            {note ? noteToSolfege(note) : '•'}
                          </div>
                        );
                      })}

                      {/* Nút Backspace xóa nốt vừa nhập & Nút Reset xóa hết */}
                      {userRecallSequence.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={handleBackspaceNote}
                            className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-mono"
                            title="Xóa nốt vừa gõ (Backspace)"
                          >
                            ⌫
                          </button>
                          <button
                            onClick={handleClearSequence}
                            className="px-1.5 py-0.5 rounded-md bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors cursor-pointer text-[9px] font-mono font-bold"
                            title="Xóa toàn bộ làm lại từ đầu (Alt+C hoặc Esc / Del)"
                          >
                            CLR
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hàng phím nốt tương tác */}
                    <div className="flex items-center gap-1">
                      {getKeyDefinitionsForRule(currentRule).map((k) => (
                        <button
                          key={k.key}
                          onClick={() => handleInputNote(k.note)}
                          className={`group flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-sm ${
                            k.isBlack
                              ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-amber-300'
                              : 'bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700 hover:border-indigo-400'
                          }`}
                          title={`Bấm phím ${k.key} (${k.solfege})`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-700 group-hover:bg-indigo-700 text-[9px] flex items-center justify-center font-mono font-bold">
                            {k.key}
                          </span>
                          <span className="text-[10px] hidden sm:inline">{k.solfege}</span>
                        </button>
                      ))}
                    </div>

                    {/* Nút chuyển đổi nhanh quy tắc bàn phím */}
                    <button
                      onClick={cycleInputRule}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      title={`Đang dùng quy tắc: ${ruleInfo.name}. Nhấn để đổi quy tắc.`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>{ruleInfo.badge}</span>
                    </button>
                  </div>
                ) : (
                  /* Trắc nghiệm 1..4 (Multiple Choice) hoặc Nhận Diện Quãng */
                  <div className="flex items-center gap-1.5">
                    {currentOfficeQuestion.options.map((opt) => (
                      <button
                        key={opt.index}
                        onClick={() => handleAnswer(opt.index)}
                        className="group relative flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-sm"
                        title={`Phím tắt: Alt+${opt.index} hoặc gõ phím ${opt.index}`}
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-700 group-hover:bg-indigo-700 text-[10px] flex items-center justify-center font-mono font-bold">
                          {opt.index}
                        </span>
                        <span className="text-xs">{opt.label || opt.code}</span>
                      </button>
                    ))}

                    {isPitchRecall && (
                      <button
                        onClick={cycleInputRule}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        title="Đổi sang chế độ gõ nốt tuần tự"
                      >
                        <Layers className="w-3 h-3" />
                        <span>{ruleInfo.badge}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Nút nghe lại */}
                <button
                  onClick={handleReplay}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Nghe lại (Alt+R)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Nút bỏ qua */}
                <button
                  onClick={handleNextOrSkip}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Bỏ qua câu này (Alt+N)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 6. Trạng thái: STANDBY (Đếm ngược) */}
            {!officeModePaused && officeQuestionState === 'standby' && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Headphones className="w-4 h-4" />
                </div>

                {/* Streak dots */}
                <div className="flex items-center gap-0.5" title={`Chuỗi đúng: ${officeSession.currentStreak}`}>
                  {[...Array(Math.min(5, Math.max(1, officeSession.currentStreak)))].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < officeSession.currentStreak ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                  {officeSession.currentStreak > 5 && (
                    <span className="text-[10px] font-mono text-amber-400 ml-0.5 font-bold">
                      +{officeSession.currentStreak - 5}
                    </span>
                  )}
                </div>

                {/* Đồng hồ đếm ngược hoặc nhãn On-Demand */}
                {officeSettings.mode === 'drip' ? (
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {formatTimer(secondsUntilNext)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                    Theo yêu cầu
                  </span>
                )}

                {/* Nút phát ngay câu mới */}
                <button
                  onClick={handleNextOrSkip}
                  className="p-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                  title="Phát câu mới ngay (Alt+N)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            )}

            {/* Nút 1-click đẩy thanh Lên / Xuống */}
            <button
              onClick={toggleQuickVerticalPosition}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
              title={isTopFlipped || (dragPos && dragPos.y < 200) ? 'Đẩy thanh xuống dưới' : 'Đẩy thanh lên trên'}
            >
              {isTopFlipped || (dragPos && dragPos.y < 200) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Nút Info / Bảng thống kê & Hướng dẫn */}
            <button
              onClick={() => toggleInfoPanel()}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bảng điều khiển & Hướng dẫn sử dụng (Alt+I)"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
