import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { officeModeEngine } from '../services/officeModeEngine';
import { auditoryEngine } from '../services/auditoryEngine';
import { useGlobalHotkeys } from './useGlobalHotkeys';

export const useOfficeMode = () => {
  const {
    officeModeActive,
    officeModePaused,
    officeSettings,
    currentOfficeQuestion,
    officeQuestionState,
    secondsUntilNext,
    userRecallSequence,
    activeGameSlug,
    togglePauseOfficeMode,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext,
    incrementOfficeReplay,
    recordOfficeAnswer,
    inputPitchRecallNote,
    backspacePitchRecallNote,
    clearPitchRecallSequence,
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

  // 4. Phát âm thanh của đáp án trong chế độ Freestyle (Trắc nghiệm hoặc quãng)
  const handleFreestylePlayOption = useCallback(async (optionIndex: number) => {
    if (!currentOfficeQuestion) return;
    await officeModeEngine.playOptionAudio(currentOfficeQuestion, optionIndex);
  }, [currentOfficeQuestion]);

  // Phát âm thanh của một nốt cụ thể khi bấm phím / click nốt tự do
  const handleFreestylePlayNote = useCallback(async (note: string) => {
    try {
      await auditoryEngine.resumeAudioContext();
      auditoryEngine.playNote(note, 0.45, { volume: officeSettings.volume });
    } catch (e) {
      console.warn('Freestyle play note error:', e);
    }
  }, [officeSettings.volume]);

  // 5. Xử lý Trả lời câu hỏi dạng Trắc nghiệm 1..4 (Alt+1..6 hoặc phím 1..6)
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (!currentOfficeQuestion || officeQuestionState !== 'waiting') return;

    if (waitingTimerRef.current) {
      window.clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }

    const result = recordOfficeAnswer(optionIndex);
    if (!result) return;

    if (result.isCorrect) {
      await officeModeEngine.playCorrectFeedback();
      if (result.awardedXp > 0) {
        addXp(result.awardedXp);
      }

      feedbackTimerRef.current = window.setTimeout(() => {
        setCurrentOfficeQuestion(null);
        setOfficeQuestionState('standby');
        setSecondsUntilNext(officeSettings.intervalMinutes * 60);
        feedbackTimerRef.current = null;
      }, 1600);
    } else {
      if (currentOfficeQuestion.exerciseSlug === 'interval-identify') {
        const chosenOpt = currentOfficeQuestion.options.find(o => o.index === optionIndex);
        if (chosenOpt) {
          const pairKey = [chosenOpt.code, result.correctCode].sort().join(':');
          recordEarConfusion(pairKey);
        }
      }

      await officeModeEngine.playWrongFeedback(
        currentOfficeQuestion,
        officeSettings.autoReplayOnWrong
      );

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

  // 6. Xử lý nhập nốt tuần tự cho bài Nhớ Cao Độ
  const handleInputNote = useCallback(async (note: string) => {
    if (!currentOfficeQuestion || officeQuestionState !== 'waiting') return;

    // Phát âm thanh nốt tức thì để người dùng cảm nhận âm thanh vừa gõ
    try {
      await auditoryEngine.resumeAudioContext();
      auditoryEngine.playNote(note, 0.45, { volume: officeSettings.volume });
    } catch (e) {
      console.warn('Note auditory feedback error:', e);
    }

    const result = inputPitchRecallNote(note);
    if (!result) return; // Chưa gõ đủ số nốt

    // Đã gõ đủ số nốt mục tiêu -> Kết quả chấm điểm
    if (waitingTimerRef.current) {
      window.clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }

    if (result.isCorrect) {
      await officeModeEngine.playCorrectFeedback();
      if (result.awardedXp > 0) {
        addXp(result.awardedXp);
      }

      feedbackTimerRef.current = window.setTimeout(() => {
        setCurrentOfficeQuestion(null);
        setOfficeQuestionState('standby');
        setSecondsUntilNext(officeSettings.intervalMinutes * 60);
        feedbackTimerRef.current = null;
      }, 1600);
    } else {
      await officeModeEngine.playWrongFeedback(
        currentOfficeQuestion,
        officeSettings.autoReplayOnWrong
      );

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
    officeSettings.volume,
    officeSettings.autoReplayOnWrong,
    officeSettings.freestyleOnWrong,
    officeSettings.intervalMinutes,
    inputPitchRecallNote,
    addXp,
    setCurrentOfficeQuestion,
    setOfficeQuestionState,
    setSecondsUntilNext
  ]);

  // Xóa nốt vừa gõ (Backspace)
  const handleBackspaceNote = useCallback(() => {
    backspacePitchRecallNote();
  }, [backspacePitchRecallNote]);

  // Xóa toàn bộ chuỗi đang gõ dở để gõ lại từ đầu (Clear/Reset)
  const handleClearSequence = useCallback(() => {
    clearPitchRecallSequence();
  }, [clearPitchRecallSequence]);

  // 7. Xử lý Câu tiếp / Bỏ qua / Kết thúc Freestyle (Alt+N)
  const handleNextOrSkip = useCallback(() => {
    if (officeQuestionState === 'freestyle') {
      finishFreestyleAndNext();
    } else if (officeQuestionState === 'waiting') {
      skipOfficeQuestion();
    } else if (officeQuestionState === 'standby') {
      triggerNewQuestion();
    }
  }, [officeQuestionState, finishFreestyleAndNext, skipOfficeQuestion, triggerNewQuestion]);

  // 8. Gắn phím tắt toàn cục
  useGlobalHotkeys({
    onReplay: handleReplay,
    onNextOrSkip: handleNextOrSkip,
    onAnswer: handleAnswer,
    onInputPitchNote: handleInputNote,
    onBackspacePitchNote: handleBackspaceNote,
    onClearPitchSequence: handleClearSequence,
    onFreestylePlayNote: handleFreestylePlayNote,
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

        // 1 chạm nút tai nghe (Play/Pause) tai phải: Nghe lại chuỗi nốt + bung cửa sổ nếu đang thu nhỏ
        navigator.mediaSession.setActionHandler('play', () => {
          const store = useAppStore.getState();
          if (store.isOfficePopUpMinimized) {
            store.restoreOfficePopUp();
          }
          handleReplay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          const store = useAppStore.getState();
          if (store.isOfficePopUpMinimized) {
            store.restoreOfficePopUp();
          }
          handleReplay();
        });

        // 2 chạm tai trái (Previous Track): Nghe lại chuỗi nốt (Alt+R)
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          const store = useAppStore.getState();
          if (store.isOfficePopUpMinimized) {
            store.restoreOfficePopUp();
          }
          handleReplay();
        });

        // 2 chạm tai phải (Next Track): Sang câu mới / Luyện tập ngay / Bỏ qua (Alt+N)
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          const store = useAppStore.getState();
          if (store.isOfficePopUpMinimized) {
            store.restoreOfficePopUp();
          }
          handleNextOrSkip();
        });

        // Phím Seek Backward (lùi): Xóa nốt vừa gõ (Backspace)
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          handleBackspaceNote();
        });

        // Phím Seek Forward (tiến): Tiếp tục
        navigator.mediaSession.setActionHandler('seekforward', () => {
          handleNextOrSkip();
        });
      } catch (e) {
        // ignore
      }
    }
  }, [officeModeActive, officeSettings.exerciseSlug, handleReplay, handleNextOrSkip, handleBackspaceNote]);

  // 9. Đồng hồ đếm ngược (Drip Mode Timer)
  useEffect(() => {
    if (!officeModeActive || officeModePaused) return;

    if (officeQuestionState !== 'standby') return;
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

  // 10. Auto-skip nếu user không trả lời sau 60 giây khi đang chờ
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
    handleInputNote,
    handleBackspaceNote,
    handleClearSequence,
    handleFreestylePlayNote,
    handleFreestylePlayOption,
    handleNextOrSkip,
    triggerNewQuestion,
    userRecallSequence
  };
};
