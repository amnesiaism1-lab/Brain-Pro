import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

export const OfficePillStandalone: React.FC = () => {
  const {
    officeModeActive,
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

  // Mặc định là chế độ Trắng Sáng Dịu (Soft Light) theo yêu cầu người dùng
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const url = window.location.href;
    if (url.includes('theme=dark')) return false;
    if (url.includes('theme=light')) return true;
    return true; // Mặc định sáng dịu
  });

  // Đảm bảo Office Mode luôn được BẬT khi mở route này
  useEffect(() => {
    if (!officeModeActive) {
      toggleOfficeMode(true);
    }
    auditoryEngine.resumeAudioContext().catch(() => { });
  }, [officeModeActive, toggleOfficeMode]);

  // Cầu nối giao tiếp 2 chiều với C# WPF qua Microsoft WebView2
  useEffect(() => {
    const handleWebViewMessage = (e: any) => {
      const data = typeof e.data === 'string' ? e.data : e.data?.action;
      if (!data) return;

      auditoryEngine.resumeAudioContext().catch(() => { });

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
      } else if (data === 'hotkey:theme') {
        setIsLightMode(prev => !prev);
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

    if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.addEventListener('message', handleWebViewMessage);
    }
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

  // Gửi trạng thái cho C# WPF
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
    <div
      className={`w-full h-full min-h-screen flex flex-col justify-center p-3 select-none overflow-hidden font-sans transition-colors duration-200 ${isLightMode
          ? 'bg-slate-50/98 text-slate-800'
          : 'bg-slate-950/98 text-white'
        }`}
    >
      {/* 1. Header Mini: Logo, Cấp độ, Quy tắc phím & Nút đổi màu theme */}
      <div
        className={`flex items-center justify-between pb-1.5 mb-2 border-b text-xs ${isLightMode ? 'border-slate-200/80 text-slate-600' : 'border-slate-800 text-slate-300'
          }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span className={`font-bold tracking-tight text-xs ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>
            Brain Pro • {isPitchRecall ? 'Nhớ Cao Độ' : 'Nhận Diện Quãng'}
          </span>
          {currentOfficeQuestion && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${isLightMode
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}
            >
              Cấp {currentOfficeQuestion.level}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Nút đổi quy tắc phím */}
          {isPitchRecall && (
            <button
              onClick={cycleInputRule}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer ${isLightMode
                  ? 'bg-white hover:bg-slate-100 text-indigo-700 border-slate-200 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                }`}
              title={`Đang dùng: ${ruleInfo.name}. Bấm để đổi quy tắc.`}
            >
              <Layers className="w-3 h-3 text-indigo-500" />
              <span>{ruleInfo.shortName}</span>
            </button>
          )}

          {/* Toggle Sáng / Tối */}
          <button
            onClick={() => setIsLightMode(p => !p)}
            className={`p-1 rounded-lg border transition-colors cursor-pointer ${isLightMode
                ? 'bg-white hover:bg-slate-100 text-amber-600 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
              }`}
            title={isLightMode ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng dịu'}
          >
            {isLightMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>

          {/* Mở tab web đầy đủ */}
          <a
            href="/#/exercises/pitch-recall"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-1 rounded-lg transition-colors cursor-pointer ${isLightMode ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            title="Mở ứng dụng Brain Pro đầy đủ trên trình duyệt"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Thân chính */}
      <div className="flex-1 flex items-center justify-between gap-2">
        {/* TRẠNG THÁI 1: FREESTYLE REVIEW (Khi trả lời sai) */}
        {officeQuestionState === 'freestyle' && lastOfficeAnswerResult && currentOfficeQuestion ? (
          <div className="w-full space-y-1.5 text-left animate-scale-up">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold line-through text-rose-500 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {lastOfficeAnswerResult.selectedLabel}
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {lastOfficeAnswerResult.correctLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReplay}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${isLightMode
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  title="Nghe lại (Alt+R)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Nghe lại</span>
                </button>
                <button
                  onClick={handleNextOrSkip}
                  className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm shadow-indigo-500/20"
                  title="Tiếp tục (Alt+N hoặc Enter)"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Chi tiết từng nốt */}
            {isPitchRecall && lastOfficeAnswerResult.sequenceNotes && (
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {lastOfficeAnswerResult.sequenceNotes.map((targetNote, idx) => {
                  const userNote = lastOfficeAnswerResult.userNotes?.[idx];
                  const isSlotCorrect = userNote === targetNote;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${isSlotCorrect
                          ? isLightMode
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                          : isLightMode
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
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

            {/* Hàng phím gõ thử đối chiếu */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Bấm thử:</span>
              {getKeyDefinitionsForRule(currentRule).map((k) => (
                <button
                  key={k.key}
                  onClick={() => handleFreestylePlayNote(k.note)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${k.isBlack
                      ? 'bg-slate-800 text-amber-300 border-slate-700'
                      : isLightMode
                        ? 'bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 border-slate-700'
                    }`}
                  title={`Bấm để nghe nốt ${k.solfege}`}
                >
                  <span className="font-mono text-indigo-500 font-black">{k.key}</span>
                  <span>{k.solfege}</span>
                </button>
              ))}
            </div>
          </div>
        ) : officeQuestionState === 'feedback' && lastOfficeAnswerResult ? (
          /* TRẠNG THÁI 2: FEEDBACK ĐÚNG */
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300 animate-scale-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Chính xác: {lastOfficeAnswerResult.correctLabel}</span>
            {lastOfficeAnswerResult.awardedXp > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-500/30 text-[10px] font-mono text-emerald-800 dark:text-emerald-200 font-bold">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                +{lastOfficeAnswerResult.awardedXp} XP
              </span>
            )}
          </div>
        ) : officeQuestionState === 'playing' ? (
          /* TRẠNG THÁI 3: ĐANG PHÁT ÂM THANH */
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-indigo-500 animate-bounce" />
            <span className={`text-xs font-bold ${isLightMode ? 'text-indigo-900' : 'text-indigo-200'}`}>
              {isPitchRecall ? `Đang phát chuỗi ${currentOfficeQuestion?.sequenceNotes?.length || 3} nốt...` : 'Đang phát âm thanh...'}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-indigo-600 rounded-full animate-pulse delay-150" />
            </div>
          </div>
        ) : officeQuestionState === 'waiting' && currentOfficeQuestion ? (
          /* TRẠNG THÁI 4: CHỜ TRẢ LỜI */
          <div className="w-full flex items-center justify-between gap-2">
            {isPitchRecall && currentRule !== 'multiple-choice' ? (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {/* Slots tiến độ */}
                <div className="flex items-center gap-1">
                  {currentOfficeQuestion.sequenceNotes?.map((_, idx) => {
                    const note = userRecallSequence[idx];
                    const isCurrentSlot = idx === userRecallSequence.length;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold min-w-[1.8rem] border transition-all ${note
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                            : isCurrentSlot
                              ? isLightMode
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-200 animate-pulse'
                                : 'bg-slate-800 border-indigo-500/80 text-indigo-300 ring-2 ring-indigo-500/30 animate-pulse'
                              : isLightMode
                                ? 'bg-white border-slate-200 text-slate-400'
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
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono transition-colors cursor-pointer ${isLightMode
                          ? 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                        }`}
                      title="Xóa nốt vừa gõ (Backspace)"
                    >
                      ⌫
                    </button>
                  )}
                </div>

                {/* Hàng phím nốt tương tác */}
                <div className="flex items-center gap-1">
                  {getKeyDefinitionsForRule(currentRule).map((k) => (
                    <button
                      key={k.key}
                      onClick={() => handleInputNote(k.note)}
                      className={`group flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-xs font-bold transition-all transform active:scale-95 cursor-pointer ${k.isBlack
                          ? 'bg-slate-850 hover:bg-slate-750 border-slate-700 text-amber-300'
                          : isLightMode
                            ? 'bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border-slate-200 hover:border-indigo-500 shadow-2xs'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700 hover:border-indigo-400'
                        }`}
                      title={`Bấm phím ${k.key} (${k.solfege})`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-mono font-bold ${isLightMode
                            ? 'bg-slate-100 group-hover:bg-indigo-700 group-hover:text-white text-slate-600'
                            : 'bg-slate-700 group-hover:bg-indigo-700 text-slate-300'
                          }`}
                      >
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
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isLightMode
                        ? 'bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border-slate-200 hover:border-indigo-500 shadow-2xs'
                        : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700'
                      }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
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
                className={`p-1 rounded-lg border transition-colors cursor-pointer ${isLightMode
                    ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                title="Nghe lại (Alt+R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextOrSkip}
                className={`p-1 rounded-lg border transition-colors cursor-pointer ${isLightMode
                    ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                title="Bỏ qua câu này (Alt+N)"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI 5: STANDBY (Đếm ngược) */
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Câu tiếp theo sau:
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${isLightMode
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-indigo-950/60 text-indigo-400 border-indigo-900'
                  }`}
              >
                {formatTimer(secondsUntilNext)}
              </span>
              <span className="text-[10px] text-amber-500 font-bold ml-1">
                🔥 Chuỗi: {officeSession.currentStreak}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNextOrSkip}
                className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
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
