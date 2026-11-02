import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { officeModeEngine } from '../services/officeModeEngine';
import { useGlobalHotkeys } from './useGlobalHotkeys';

export const useOfficeMode = () => {
  const {
    officeModeActive,
    officeModePaused,
    officeSettings,
    currentOfficeQuestion,
    officeQuestionState,
    secondsUntilNext,
    activeGameSlug,
    togglePauseOfficeMode,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext,
    incrementOfficeReplay,
    recordOfficeAnswer,
    skipOfficeQuestion,
    addXp,
    recordEarConfusion
  } = useAppStore();

  const typingDelayCountRef = useRef(0);
  const waitingTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // 1. Tự động tạm dừng khi đang chơi game khác trong ứng dụng
  useEffect(() => {
    if (activeGameSlug && officeModeActive && !officeModePaused) {
      togglePauseOfficeMode();
    }
  }, [activeGameSlug, officeModeActive, officeModePaused, togglePauseOfficeMode]);

  // 2. Kích hoạt phát câu hỏi mới
  const triggerNewQuestion = useCallback(async () => {
    if (!officeModeActive || officeModePaused) return;

    // Kiểm tra tần suất gõ phím nếu tính năng delay khi gõ đang bật
    if (officeSettings.delayWhenTyping && officeModeEngine.isUserActivelyTyping()) {
      if (typingDelayCountRef.current < 3) {
        typingDelayCountRef.current += 1;
        setSecondsUntilNext(15);
        return;
      }
    }
    typingDelayCountRef.current = 0;

    const newQ = officeModeEngine.generateIntervalQuestion();
    setCurrentOfficeQuestion(newQ);
    setOfficeQuestionState('playing');

    try {
      await officeModeEngine.playQuestionAudio(newQ, false);
      setOfficeQuestionState('waiting');
    } catch (e) {
      console.warn('Failed to play office question:', e);
      setOfficeQuestionState('waiting');
    }
  }, [
    officeModeActive,
    officeModePaused,
    officeSettings.delayWhenTyping,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext
  ]);

  // 3. Xử lý nghe lại (Alt+R)
  const handleReplay = useCallback(async () => {
    if (!currentOfficeQuestion || officeQuestionState !== 'waiting') return;

    incrementOfficeReplay();
    setOfficeQuestionState('playing');

    try {
      await officeModeEngine.playQuestionAudio(currentOfficeQuestion, true);
    } catch (e) {
      console.warn('Replay error:', e);
    } finally {
      setOfficeQuestionState('waiting');
    }
  }, [currentOfficeQuestion, officeQuestionState, incrementOfficeReplay, setOfficeQuestionState]);

  // 4. Xử lý Trả lời câu hỏi (Alt+1..6 hoặc phím 1..6)
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (!currentOfficeQuestion || officeQuestionState !== 'waiting') return;

    if (waitingTimerRef.current) {
      window.clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }

    const result = recordOfficeAnswer(optionIndex);
    if (!result) return;

    if (result.isCorrect) {
      // Phản hồi đúng
      await officeModeEngine.playCorrectFeedback();
      if (result.awardedXp > 0) {
        addXp(result.awardedXp);
      }
    } else {
      // Ghi nhận nhầm lẫn quãng vào Confusion Matrix
      const chosenOpt = currentOfficeQuestion.options.find(o => o.index === optionIndex);
      if (chosenOpt) {
        const pairKey = [chosenOpt.code, result.correctCode].sort().join(':');
        recordEarConfusion(pairKey);
      }

      // Phản hồi sai (buzz + phát lại quãng đúng)
      await officeModeEngine.playWrongFeedback(
        currentOfficeQuestion,
        officeSettings.autoReplayOnWrong
      );
    }

    // Hiển thị feedback trong 1.8 giây rồi chuyển về standby đếm ngược
    const delayMs = result.isCorrect ? 1500 : 2200;
    feedbackTimerRef.current = window.setTimeout(() => {
      setCurrentOfficeQuestion(null);
      setOfficeQuestionState('standby');
      setSecondsUntilNext(officeSettings.intervalMinutes * 60);
      feedbackTimerRef.current = null;
    }, delayMs);
  }, [
    currentOfficeQuestion,
    officeQuestionState,
    recordOfficeAnswer,
    addXp,
    recordEarConfusion,
    officeSettings.autoReplayOnWrong,
    officeSettings.intervalMinutes,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext
  ]);

  // 5. Xử lý Câu tiếp / Bỏ qua (Alt+N)
  const handleNextOrSkip = useCallback(() => {
    if (officeQuestionState === 'waiting') {
      skipOfficeQuestion();
    } else if (officeQuestionState === 'standby') {
      triggerNewQuestion();
    }
  }, [officeQuestionState, skipOfficeQuestion, triggerNewQuestion]);

  // 6. Gắn phím tắt toàn cục
  useGlobalHotkeys({
    onReplay: handleReplay,
    onNextOrSkip: handleNextOrSkip,
    onAnswer: handleAnswer
  });

  // 7. Đồng hồ đếm ngược (Drip Mode Timer)
  useEffect(() => {
    if (!officeModeActive || officeModePaused) return;

    // Chỉ đếm ngược khi đang ở trạng thái standby
    if (officeQuestionState !== 'standby') return;

    // Nếu ở chế độ On-Demand thì không tự động phát
    if (officeSettings.mode === 'on-demand') return;

    const interval = window.setInterval(() => {
      setSecondsUntilNext(prev => {
        if (prev <= 1) {
          triggerNewQuestion();
          return officeSettings.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    officeModeActive,
    officeModePaused,
    officeQuestionState,
    officeSettings.mode,
    officeSettings.intervalMinutes,
    setSecondsUntilNext,
    triggerNewQuestion
  ]);

  // 8. Auto-skip nếu user không trả lời sau 60 giây khi đang chờ
  useEffect(() => {
    if (officeQuestionState === 'waiting') {
      waitingTimerRef.current = window.setTimeout(() => {
        skipOfficeQuestion();
      }, 60000);
    }

    return () => {
      if (waitingTimerRef.current) {
        window.clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
    };
  }, [officeQuestionState, skipOfficeQuestion]);

  // Dọn dẹp timers khi unmount
  useEffect(() => {
    return () => {
      if (waitingTimerRef.current) window.clearTimeout(waitingTimerRef.current);
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return {
    handleReplay,
    handleAnswer,
    handleNextOrSkip,
    triggerNewQuestion
  };
};
