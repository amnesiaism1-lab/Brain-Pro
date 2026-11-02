import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface UseGlobalHotkeysProps {
  onReplay: () => void;
  onNextOrSkip: () => void;
  onAnswer: (index: number) => void;
  onFreestylePlayOption: (index: number) => void;
}

export const useGlobalHotkeys = ({
  onReplay,
  onNextOrSkip,
  onAnswer,
  onFreestylePlayOption
}: UseGlobalHotkeysProps): void => {
  const {
    officeModeActive,
    officeQuestionState,
    isInfoPanelOpen,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel
  } = useAppStore();

  const propsRef = useRef({
    onReplay,
    onNextOrSkip,
    onAnswer,
    onFreestylePlayOption,
    officeModeActive,
    officeQuestionState,
    isInfoPanelOpen,
    toggleOfficeMode,
    togglePauseOfficeMode,
    toggleInfoPanel
  });

  useEffect(() => {
    propsRef.current = {
      onReplay,
      onNextOrSkip,
      onAnswer,
      onFreestylePlayOption,
      officeModeActive,
      officeQuestionState,
      isInfoPanelOpen,
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

      // 3. Các tổ hợp phím có Alt (Alt + Key)
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

        // Alt + 1..6: Chọn đáp án hoặc nghe thử option
        if (/^[1-6]$/.test(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          const num = parseInt(e.key, 10);
          if (propsRef.current.officeQuestionState === 'freestyle') {
            propsRef.current.onFreestylePlayOption(num);
          } else if (propsRef.current.officeQuestionState === 'waiting') {
            propsRef.current.onAnswer(num);
          }
          return;
        }
      }

      // 4. Phím số trực tiếp (1..6 không cần Alt)
      // Kích hoạt khi:
      // - Office Mode đang bật
      // - Người dùng KHÔNG đang gõ trong input/textarea
      // - Không giữ phím Ctrl / Meta / Alt
      if (
        propsRef.current.officeModeActive &&
        !isInputFocused &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        /^[1-6]$/.test(e.key)
      ) {
        const num = parseInt(e.key, 10);
        if (propsRef.current.officeQuestionState === 'waiting') {
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.onAnswer(num);
        } else if (propsRef.current.officeQuestionState === 'freestyle') {
          // Trong trạng thái Freestyle: Nhấn số là phát âm thanh của quãng đó để nghe thử tự do
          e.preventDefault();
          e.stopPropagation();
          propsRef.current.onFreestylePlayOption(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
};
