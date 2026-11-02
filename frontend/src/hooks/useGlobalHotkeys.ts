import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { mapKeyToNote } from '../services/pitchRecallKeyMap';

interface UseGlobalHotkeysProps {
  onReplay: () => void;
  onNextOrSkip: () => void;
  onAnswer: (index: number) => void;
  onInputPitchNote: (note: string) => void;
  onBackspacePitchNote: () => void;
  onFreestylePlayNote: (note: string) => void;
  onFreestylePlayOption: (index: number) => void;
}

export const useGlobalHotkeys = ({
  onReplay,
  onNextOrSkip,
  onAnswer,
  onInputPitchNote,
  onBackspacePitchNote,
  onFreestylePlayNote,
  onFreestylePlayOption
}: UseGlobalHotkeysProps): void => {
  const {
    officeModeActive,
    officeQuestionState,
    isInfoPanelOpen,
    currentOfficeQuestion,
    officeSettings,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel
  } = useAppStore();

  const propsRef = useRef({
    onReplay,
    onNextOrSkip,
    onAnswer,
    onInputPitchNote,
    onBackspacePitchNote,
    onFreestylePlayNote,
    onFreestylePlayOption,
    officeModeActive,
    officeQuestionState,
    isInfoPanelOpen,
    currentOfficeQuestion,
    officeSettings,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel
  });

  useEffect(() => {
    propsRef.current = {
      onReplay,
      onNextOrSkip,
      onAnswer,
      onInputPitchNote,
      onBackspacePitchNote,
      onFreestylePlayNote,
      onFreestylePlayOption,
      officeModeActive,
      officeQuestionState,
      isInfoPanelOpen,
      currentOfficeQuestion,
      officeSettings,
      toggleOfficeMode,
      togglePauseOfficeMode,
      toggleInfoPanel
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      const keyLower = e.key.toLowerCase();
      const currentQ = propsRef.current.currentOfficeQuestion;
      const rule = propsRef.current.officeSettings.pitchRecallInputRule || 'scale-degrees';
      const isPitchRecall = currentQ?.exerciseSlug === 'pitch-recall';

      // 1. Phím Escape: Đóng panel thông tin nếu đang mở
      if (e.key === 'Escape') {
        if (propsRef.current.isInfoPanelOpen) {
          e.preventDefault();
          propsRef.current.toggleInfoPanel(false);
          return;
        }
      }

      // 2. Phím Space hoặc Enter khi đang ở chế độ Freestyle: Chuyển câu tiếp theo
      if (
        propsRef.current.officeModeActive &&
        propsRef.current.officeQuestionState === 'freestyle' &&
        !isInputFocused &&
        (e.key === 'Enter' || e.code === 'Space')
      ) {
        e.preventDefault();
        e.stopPropagation();
        propsRef.current.onNextOrSkip();
        return;
      }

      // 3. Phím Backspace khi đang gõ chuỗi Nhớ Cao Độ
      if (
        propsRef.current.officeModeActive &&
        propsRef.current.officeQuestionState === 'waiting' &&
        isPitchRecall &&
        rule !== 'multiple-choice' &&
        !isInputFocused &&
        e.key === 'Backspace'
      ) {
        e.preventDefault();
        e.stopPropagation();
        propsRef.current.onBackspacePitchNote();
        return;
      }

      // 4. Các tổ hợp phím có Alt (Alt + Key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        // Alt + Q: Bật / Tắt Office Mode
        if (keyLower === 'q') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.toggleOfficeMode();
          return;
        }

        // Nếu Office Mode đang tắt thì không bắt các phím Alt khác
        if (!propsRef.current.officeModeActive) return;

        // Alt + P: Tạm dừng / Tiếp tục
        if (keyLower === 'p') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.togglePauseOfficeMode();
          return;
        }

        // Alt + I: Mở / Đóng panel thông tin & hướng dẫn
        if (keyLower === 'i') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.toggleInfoPanel();
          return;
        }

        // Alt + R: Nghe lại câu hỏi
        if (keyLower === 'r') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.onReplay();
          return;
        }

        // Alt + N: Câu tiếp theo / Bỏ qua câu hiện tại / Kết thúc Freestyle
        if (keyLower === 'n') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.onNextOrSkip();
          return;
        }

        // Alt + 1..6: Chọn đáp án trắc nghiệm hoặc phím nốt bậc âm
        if (/^[1-6]$/.test(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          const num = parseInt(e.key, 10);
          if (isPitchRecall && rule !== 'multiple-choice') {
            const mapped = mapKeyToNote(e.key, 'scale-degrees');
            if (mapped) {
              if (propsRef.current.officeQuestionState === 'freestyle') {
                propsRef.current.onFreestylePlayNote(mapped);
              } else if (propsRef.current.officeQuestionState === 'waiting') {
                propsRef.current.onInputPitchNote(mapped);
              }
            }
          } else {
            if (propsRef.current.officeQuestionState === 'freestyle') {
              propsRef.current.onFreestylePlayOption(num);
            } else if (propsRef.current.officeQuestionState === 'waiting') {
              propsRef.current.onAnswer(num);
            }
          }
          return;
        }
      }

      // 5. Bàn phím trực tiếp (Không cần Alt) khi Office Mode đang bật và không gõ trong Input
      if (
        propsRef.current.officeModeActive &&
        !isInputFocused &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Trường hợp A: Bài tập Nhớ Cao Độ với quy tắc nhập phím (Bậc âm, Piano, Ký âm chữ cái)
        if (isPitchRecall && rule !== 'multiple-choice') {
          const note = mapKeyToNote(e.key, rule);
          if (note) {
            e.preventDefault();
            e.stopPropagation();
            if (propsRef.current.officeQuestionState === 'waiting') {
              propsRef.current.onInputPitchNote(note);
            } else if (propsRef.current.officeQuestionState === 'freestyle') {
              propsRef.current.onFreestylePlayNote(note);
            }
            return;
          }
        }

        // Trường hợp B: Bài tập Nhận Diện Quãng hoặc Nhớ Cao Độ dạng Trắc Nghiệm 1..4
        if (!isPitchRecall || rule === 'multiple-choice') {
          if (/^[1-6]$/.test(e.key)) {
            const num = parseInt(e.key, 10);
            e.preventDefault();
            e.stopPropagation();
            if (propsRef.current.officeQuestionState === 'waiting') {
              propsRef.current.onAnswer(num);
            } else if (propsRef.current.officeQuestionState === 'freestyle') {
              propsRef.current.onFreestylePlayOption(num);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
};
