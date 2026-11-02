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
    finishFreestyleAndNext,
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

  // Yêu cầu quyền thông báo nếu bật
  useEffect(() => {
    if (officeModeActive && officeSettings.enableNotifications && typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [officeModeActive, officeSettings.enableNotifications]);

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

    const newQ = officeModeEngine.generateNextQuestion();
    setCurrentOfficeQuestion(newQ);
    setOfficeQuestionState('playing');

    if (officeSettings.enableNotifications) {
      officeModeEngine.showBackgroundNotification(newQ);
    }

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
    officeSettings.enableNotifications,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext
  ]);

  // 3. Xử lý nghe lại (Alt+R) - hỗ trợ cả lúc waiting và freestyle
  const handleReplay = useCallback(async () => {
    if (!currentOfficeQuestion || (officeQuestionState !== 'waiting' && officeQuestionState !== 'freestyle')) return;

    const previousState = officeQuestionState;
    incrementOfficeReplay();
    setOfficeQuestionState('playing');

    try {
      await officeModeEngine.playQuestionAudio(currentOfficeQuestion, true);
    } catch (e) {
      console.warn('Replay error:', e);
    } finally {
      setOfficeQuestionState(previousState);
    }
  }, [currentOfficeQuestion, officeQuestionState, incrementOfficeReplay, setOfficeQuestionState]);

  // 4. Phát âm thanh của đáp án trong chế độ Freestyle
  const handleFreestylePlayOption = useCallback(async (optionIndex: number) => {
    if (!currentOfficeQuestion) return;
    await officeModeEngine.playOptionAudio(currentOfficeQuestion, optionIndex);
  }, [currentOfficeQuestion]);

  // 5. Xử lý Trả lời câu hỏi (Alt+1..6 hoặc phím 1..6)
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

      // Khi đúng: tự động chuyển về standby đếm ngược sau 1.6s
      feedbackTimerRef.current = window.setTimeout(() => {
        setCurrentOfficeQuestion(null);
        setOfficeQuestionState('standby');
        setSecondsUntilNext(officeSettings.intervalMinutes * 60);
        feedbackTimerRef.current = null;
      }, 1600);
    } else {
      // Ghi nhận nhầm lẫn quãng vào Confusion Matrix nếu là bài quãng
      if (currentOfficeQuestion.exerciseSlug === 'interval-identify') {
        const chosenOpt = currentOfficeQuestion.options.find(o => o.index === optionIndex);
        if (chosenOpt) {
          const pairKey = [chosenOpt.code, result.correctCode].sort().join(':');
          recordEarConfusion(pairKey);
        }
      }

      // Phản hồi sai (buzz + phát lại đáp án đúng)
      await officeModeEngine.playWrongFeedback(
        currentOfficeQuestion,
        officeSettings.autoReplayOnWrong
      );

      // Nếu không bật freestyleOnWrong thì mới tự tắt sau 2.5s,
      // ngược lại (mặc định) hệ thống GIỮ NGUYÊN trạng thái freestyle để người dùng tự do thử nghiệm!
      if (!officeSettings.freestyleOnWrong) {
        feedbackTimerRef.current = window.setTimeout(() => {
          setCurrentOfficeQuestion(null);
          setOfficeQuestionState('standby');
          setSecondsUntilNext(officeSettings.intervalMinutes * 60);
          feedbackTimerRef.current = null;
        }, 2500);
      }
    }
  }, [
    currentOfficeQuestion,
    officeQuestionState,
    recordOfficeAnswer,
    addXp,
    recordEarConfusion,
    officeSettings.autoReplayOnWrong,
    officeSettings.freestyleOnWrong,
    officeSettings.intervalMinutes,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext
  ]);

  // 6. Xử lý Câu tiếp / Bỏ qua / Kết thúc Freestyle (Alt+N)
  const handleNextOrSkip = useCallback(() => {
    if (officeQuestionState === 'freestyle') {
      finishFreestyleAndNext();
    } else if (officeQuestionState === 'waiting') {
      skipOfficeQuestion();
    } else if (officeQuestionState === 'standby') {
      triggerNewQuestion();
    }
  }, [officeQuestionState, finishFreestyleAndNext, skipOfficeQuestion, triggerNewQuestion]);

  // 7. Gắn phím tắt toàn cục
  useGlobalHotkeys({
    onReplay: handleReplay,
    onNextOrSkip: handleNextOrSkip,
    onAnswer: handleAnswer,
    onFreestylePlayOption: handleFreestylePlayOption
  });

  // Hỗ trợ MediaSession (Nút tai nghe Bluetooth hoặc phím media bàn phím khi tab ở background)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && officeModeActive) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: officeSettings.exerciseSlug === 'pitch-recall' ? 'Nhớ Cao Độ (Office Mode)' : 'Nhận Diện Quãng (Office Mode)',
          artist: 'Brain Pro - Luyện Tai Ngầm',
          album: 'Brain Exercises Pro'
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handleReplay();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextOrSkip();
        });
      } catch (e) {
        // ignore
      }
    }
  }, [officeModeActive, officeSettings.exerciseSlug, handleReplay, handleNextOrSkip]);

  // 8. Đồng hồ đếm ngược (Drip Mode Timer)
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

  // 9. Auto-skip nếu user không trả lời sau 60 giây khi đang chờ
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
    handleFreestylePlayOption,
    handleNextOrSkip,
    triggerNewQuestion
  };
};
