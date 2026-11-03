import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useOfficeMode } from '../../hooks/useOfficeMode';
import {
  getKeyDefinitionsForRule,
  PitchRecallInputRule,
  RULE_INFO_MAP,
  noteToSolfege,
  mapKeyToNote
} from '../../services/pitchRecallKeyMap';
import { auditoryEngine } from '../../services/auditoryEngine';
import {
  Headphones,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  Music2,
  ExternalLink,
  Layers
} from 'lucide-react';

export const OfficePillStandalone: React.FC = () => {
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
    setPitchRecallInputRule
  } = useAppStore();

  const {
    handleReplay,
    handleAnswer,
    handleInputNote,
    handleBackspaceNote,
    handleFreestylePlayNote,
    handleFreestylePlayOption,
    handleNextOrSkip,
    userRecallSequence
  } = useOfficeMode();

  // Đảm bảo Office Mode luôn được BẬT khi mở route này
  useEffect(() => {
    if (!officeModeActive) {
      toggleOfficeMode(true);
    }
    auditoryEngine.resumeAudioContext().catch(() => {});
  }, [officeModeActive, toggleOfficeMode]);

  // Cầu nối giao tiếp với C# WPF qua Microsoft WebView2
  useEffect(() => {
    const handleWebViewMessage = (e: any) => {
      const data = typeof e.data === 'string' ? e.data : e.data?.action;
      if (!data) return;

      auditoryEngine.resumeAudioContext().catch(() => {});

      if (data === 'hotkey:toggle') {
        togglePauseOfficeMode();
      } else if (data === 'hotkey:replay') {
        handleReplay();
      } else if (data === 'hotkey:next') {
        handleNextOrSkip();
      } else if (data === 'hotkey:backspace') {
        handleBackspaceNote();
      } else if (data === 'hotkey:cycle-rule') {
        cycleInputRule();
      } else if (data.startsWith('hotkey:note:')) {
        const note = data.replace('hotkey:note:', '');
        handleInputNote(note);
      } else if (data.startsWith('hotkey:num:')) {
        const num = parseInt(data.replace('hotkey:num:', ''), 10);
        if (officeSettings.exerciseSlug === 'pitch-recall' && currentRule !== 'multiple-choice') {
          const mapped = mapKeyToNote(String(num), currentRule);
          if (mapped) handleInputNote(mapped);
        } else {
          handleAnswer(num);
        }
      }
    };

    // 1. Nhận thông điệp từ C# qua WebView2: window.chrome.webview
    if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.addEventListener('message', handleWebViewMessage);
    }

    // 2. Nhận thông điệp từ postMessage thông thường
    window.addEventListener('message', handleWebViewMessage);

    return () => {
      if ((window as any).chrome?.webview) {
        (window as any).chrome.webview.removeEventListener('message', handleWebViewMessage);
      }
      window.removeEventListener('message', handleWebViewMessage);
    };
  }, [
    handleReplay,
    handleNextOrSkip,
    handleInputNote,
    handleBackspaceNote,
    handleAnswer,
    togglePauseOfficeMode,
    officeSettings.exerciseSlug
  ]);

  // Gửi trạng thái ngược lại cho C# WPF nếu có WebView2
  useEffect(() => {
    if ((window as any).chrome?.webview) {
      try {
        (window as any).chrome.webview.postMessage({
          type: 'stateChange',
          state: officeQuestionState,
          level: currentOfficeQuestion?.level || 1,
          streak: officeSession.currentStreak,
          isCorrect: lastOfficeAnswerResult?.isCorrect
        });
      } catch (err) {
        // ignore
      }
    }
  }, [officeQuestionState, currentOfficeQuestion, officeSession.currentStreak, lastOfficeAnswerResult]);

  const currentRule = officeSettings.pitchRecallInputRule || 'scale-degrees';
  const ruleInfo = RULE_INFO_MAP[currentRule];
  const isPitchRecall = currentOfficeQuestion?.exerciseSlug === 'pitch-recall';

  const cycleInputRule = () => {
    const rules: PitchRecallInputRule[] = ['scale-degrees', 'piano-keys', 'note-letters', 'multiple-choice'];
    const currentIdx = rules.indexOf(currentRule);
    const nextRule = rules[(currentIdx + 1) % rules.length];
    setPitchRecallInputRule(nextRule);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950/95 text-white flex flex-col justify-center p-3 select-none overflow-hidden font-sans border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Thanh Header nhỏ gọn */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-200">
            Brain Pro • {isPitchRecall ? 'Nhớ Cao Độ' : 'Nhận Diện Quãng'}
          </span>
          {currentOfficeQuestion && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              Cấp {currentOfficeQuestion.level}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Nút đổi quy tắc bàn phím */}
          {isPitchRecall && (
            <button
              onClick={cycleInputRule}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-mono border border-slate-700 transition-colors cursor-pointer"
              title={`Đang dùng: ${ruleInfo.name}. Bấm để đổi quy tắc.`}
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>{ruleInfo.shortName}</span>
            </button>
          )}

          {/* Mở web app đầy đủ */}
          <a
            href="/#/exercises/pitch-recall"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mở ứng dụng Brain Pro đầy đủ trên trình duyệt"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Thân chính: Tùy theo trạng thái câu hỏi */}
      <div className="flex-1 flex items-center justify-between gap-2">
        {/* 1. FREESTYLE REVIEW (Khi trả lời sai) */}
        {officeQuestionState === 'freestyle' && lastOfficeAnswerResult && currentOfficeQuestion ? (
          <div className="w-full space-y-2 text-left animate-scale-up">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold line-through text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {lastOfficeAnswerResult.selectedLabel}
                </span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {lastOfficeAnswerResult.correctLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReplay}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Nghe lại (Alt+R)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Nghe lại</span>
                </button>
                <button
                  onClick={handleNextOrSkip}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-indigo-500/20"
                  title="Tiếp tục (Alt+N hoặc Enter)"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Chi tiết từng nốt */}
            {isPitchRecall && lastOfficeAnswerResult.sequenceNotes && (
              <div className="flex items-center gap-1 overflow-x-auto">
                {lastOfficeAnswerResult.sequenceNotes.map((targetNote, idx) => {
                  const userNote = lastOfficeAnswerResult.userNotes?.[idx];
                  const isSlotCorrect = userNote === targetNote;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${
                        isSlotCorrect
                          ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-500/70 text-rose-300'
                      }`}
                    >
                      <span className="text-[8px] text-slate-400">Nốt {idx + 1}</span>
                      <span className="font-black">{noteToSolfege(targetNote)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Phím nghe thử tự do */}
            <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Bấm thử:</span>
              {getKeyDefinitionsForRule(currentRule).map((k) => (
                <button
                  key={k.key}
                  onClick={() => handleFreestylePlayNote(k.note)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                    k.isBlack
                      ? 'bg-slate-900 border-slate-700 text-amber-300'
                      : 'bg-slate-800 hover:bg-indigo-600 border-slate-700 text-slate-200'
                  }`}
                  title={`Bấm để nghe nốt ${k.solfege}`}
                >
                  <span className="font-mono text-indigo-400">{k.key}</span>
                  <span>{k.solfege}</span>
                </button>
              ))}
            </div>
          </div>
        ) : officeQuestionState === 'feedback' && lastOfficeAnswerResult ? (
          /* 2. FEEDBACK ĐÚNG */
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 animate-scale-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Chính xác: {lastOfficeAnswerResult.correctLabel}</span>
            {lastOfficeAnswerResult.awardedXp > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[10px] font-mono text-emerald-200">
                <Sparkles className="w-2.5 h-2.5" />
                +{lastOfficeAnswerResult.awardedXp} XP
              </span>
            )}
          </div>
        ) : officeQuestionState === 'playing' ? (
          /* 3. PLAYING AUDIO */
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span className="text-xs font-bold text-indigo-200">
              {isPitchRecall ? `Đang phát chuỗi ${currentOfficeQuestion?.sequenceNotes?.length || 3} nốt...` : 'Đang phát âm thanh...'}
            </span>
          </div>
        ) : officeQuestionState === 'waiting' && currentOfficeQuestion ? (
          /* 4. WAITING FOR ANSWER */
          <div className="w-full flex items-center justify-between gap-2">
            {isPitchRecall && currentRule !== 'multiple-choice' ? (
              <div className="flex items-center gap-2 overflow-x-auto">
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
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        {note ? noteToSolfege(note) : '•'}
                      </div>
                    );
                  })}

                  {userRecallSequence.length > 0 && (
                    <button
                      onClick={handleBackspaceNote}
                      className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-mono"
                      title="Xóa nốt vừa gõ (Backspace)"
                    >
                      ⌫
                    </button>
                  )}
                </div>

                {/* Hàng phím nốt bấm trực tiếp */}
                <div className="flex items-center gap-1">
                  {getKeyDefinitionsForRule(currentRule).map((k) => (
                    <button
                      key={k.key}
                      onClick={() => handleInputNote(k.note)}
                      className={`group flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-sm ${
                        k.isBlack
                          ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-amber-300'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700 hover:border-indigo-400'
                      }`}
                      title={`Bấm phím ${k.key} (${k.solfege})`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-700 group-hover:bg-indigo-700 text-[9px] flex items-center justify-center font-mono font-bold">
                        {k.key}
                      </span>
                      <span className="text-[10px]">{k.solfege}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Trắc nghiệm 1..4 */
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {currentOfficeQuestion.options.map((opt) => (
                  <button
                    key={opt.index}
                    onClick={() => handleAnswer(opt.index)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                      {opt.index}
                    </span>
                    <span className="text-xs truncate">{opt.label || opt.code}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Điều khiển Nghe lại & Bỏ qua */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleReplay}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Nghe lại (Alt+R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextOrSkip}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Bỏ qua câu này (Alt+N)"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* 5. STANDBY (Đếm ngược) */
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Câu tiếp theo sau:</span>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900">
                {formatTimer(secondsUntilNext)}
              </span>
              <span className="text-[10px] text-amber-400 font-bold ml-1">
                🔥 Chuỗi đúng: {officeSession.currentStreak}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNextOrSkip}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Phát câu mới ngay (Alt+N)"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Luyện ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
