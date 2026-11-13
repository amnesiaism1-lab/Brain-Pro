class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import { officeModeEngine } from '../../services/officeModeEngine';

describe('Office Mode (Stealth Ear Training)', () => {
  beforeEach(() => {
    localStorage.clear();
    const state = useAppStore.getState();
    if (state.officeModeActive) {
      state.toggleOfficeMode(false);
    }
    state.resetOfficeSession();
  });

  it('toggles office mode on and off properly', () => {
    const store = useAppStore.getState();
    expect(store.officeModeActive).toBe(false);

    store.toggleOfficeMode(true);
    expect(useAppStore.getState().officeModeActive).toBe(true);
    expect(useAppStore.getState().officeQuestionState).toBe('standby');
    expect(useAppStore.getState().secondsUntilNext).toBe(3 * 60);

    store.toggleOfficeMode(false);
    expect(useAppStore.getState().officeModeActive).toBe(false);
  });

  it('toggles pause and resume state', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);
    expect(useAppStore.getState().officeModePaused).toBe(false);

    store.togglePauseOfficeMode();
    expect(useAppStore.getState().officeModePaused).toBe(true);
    expect(useAppStore.getState().officeQuestionState).toBe('paused');

    store.togglePauseOfficeMode();
    expect(useAppStore.getState().officeModePaused).toBe(false);
    expect(useAppStore.getState().officeQuestionState).toBe('standby');
  });

  it('updates office settings and saves to storage', () => {
    const store = useAppStore.getState();
    store.updateOfficeSettings({
      intervalMinutes: 5,
      mode: 'on-demand',
      volume: 0.8
    });

    const updated = useAppStore.getState().officeSettings;
    expect(updated.intervalMinutes).toBe(5);
    expect(updated.mode).toBe('on-demand');
    expect(updated.volume).toBe(0.8);
  });

  it('generates valid pitch recall questions from officeModeEngine', () => {
    const q = officeModeEngine.generatePitchRecallQuestion();
    expect(q.id).toBeDefined();
    expect(q.exerciseSlug).toBe('pitch-recall');
    expect(q.sequenceNotes).toBeDefined();
    expect(q.sequenceNotes!.length).toBeGreaterThanOrEqual(3);
    expect(q.options.length).toBe(4);

    const correctOptions = q.options.filter(o => o.isCorrect);
    expect(correctOptions.length).toBe(1);
    expect(correctOptions[0].code).toBe(q.sequenceNotes!.join('-'));
  });

  it('generates valid interval questions from officeModeEngine', () => {
    const q = officeModeEngine.generateIntervalQuestion();
    expect(q.id).toBeDefined();
    expect(q.exerciseSlug).toBe('interval-identify');
    expect(q.rootNote).toBeDefined();
    expect(q.targetNote).toBeDefined();
    expect(q.options.length).toBeGreaterThanOrEqual(4);

    const correctOptions = q.options.filter(o => o.isCorrect);
    expect(correctOptions.length).toBe(1);
    expect(correctOptions[0].code).toBe(q.intervalCode);
  });

  it('records answers, updates streak, and awards 50% XP for correct answers', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);

    const question = officeModeEngine.generateIntervalQuestion();
    store.setCurrentOfficeQuestion(question);
    expect(useAppStore.getState().officeQuestionState).toBe('waiting');

    const correctOption = question.options.find(o => o.isCorrect)!;
    const result = store.recordOfficeAnswer(correctOption.index);

    expect(result).not.toBeNull();
    expect(result!.isCorrect).toBe(true);
    expect(result!.awardedXp).toBeGreaterThan(0);

    const session = useAppStore.getState().officeSession;
    expect(session.correctCount).toBe(1);
    expect(session.totalAnswered).toBe(1);
    expect(session.currentStreak).toBe(1);
    expect(session.bestStreak).toBe(1);
    expect(session.totalXpEarned).toBe(result!.awardedXp);
    expect(useAppStore.getState().officeQuestionState).toBe('feedback');
  });

  it('handles wrong answers by entering freestyle mode, resetting current streak and recording wrong count', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);

    const question = officeModeEngine.generateIntervalQuestion();
    store.setCurrentOfficeQuestion(question);

    const wrongOption = question.options.find(o => !o.isCorrect)!;
    const result = store.recordOfficeAnswer(wrongOption.index);

    expect(result).not.toBeNull();
    expect(result!.isCorrect).toBe(false);
    expect(result!.awardedXp).toBe(0);

    const session = useAppStore.getState().officeSession;
    expect(session.wrongCount).toBe(1);
    expect(session.currentStreak).toBe(0);
    expect(useAppStore.getState().officeQuestionState).toBe('freestyle');

    // Finishes freestyle
    store.finishFreestyleAndNext();
    expect(useAppStore.getState().officeQuestionState).toBe('standby');
    expect(useAppStore.getState().currentOfficeQuestion).toBeNull();
  });

  it('handles skip properly', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);

    const question = officeModeEngine.generateIntervalQuestion();
    store.setCurrentOfficeQuestion(question);

    store.skipOfficeQuestion();
    expect(useAppStore.getState().currentOfficeQuestion).toBeNull();
    expect(useAppStore.getState().officeQuestionState).toBe('standby');
    expect(useAppStore.getState().officeSession.skippedCount).toBe(1);
  });

  it('supports sequential note entry, backspace, and evaluation for pitch recall', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);

    const question = officeModeEngine.generatePitchRecallQuestion();
    // Gán chuỗi nốt cố định để kiểm tra
    question.sequenceNotes = ['C4', 'E4', 'G4'];
    store.setCurrentOfficeQuestion(question);
    expect(useAppStore.getState().userRecallSequence).toEqual([]);

    // Gõ nốt 1: C4
    const res1 = store.inputPitchRecallNote('C4');
    expect(res1).toBeNull(); // Chưa xong
    expect(useAppStore.getState().userRecallSequence).toEqual(['C4']);

    // Gõ nhầm nốt 2: D4
    store.inputPitchRecallNote('D4');
    expect(useAppStore.getState().userRecallSequence).toEqual(['C4', 'D4']);

    // Backspace để xóa D4
    store.backspacePitchRecallNote();
    expect(useAppStore.getState().userRecallSequence).toEqual(['C4']);

    // Gõ lại nốt 2 đúng: E4
    store.inputPitchRecallNote('E4');
    expect(useAppStore.getState().userRecallSequence).toEqual(['C4', 'E4']);

    // Gõ nốt 3 đúng: G4 -> Đủ chuỗi và đúng hoàn toàn!
    const resFinal = store.inputPitchRecallNote('G4');
    expect(resFinal).not.toBeNull();
    expect(resFinal!.isCorrect).toBe(true);
    expect(useAppStore.getState().officeQuestionState).toBe('feedback');
    expect(useAppStore.getState().officeSession.correctCount).toBe(1);
  });

  it('handles wrong sequential pitch entry and transitions to freestyle', () => {
    const store = useAppStore.getState();
    store.toggleOfficeMode(true);

    const question = officeModeEngine.generatePitchRecallQuestion();
    question.sequenceNotes = ['C4', 'E4', 'G4'];
    store.setCurrentOfficeQuestion(question);

    store.inputPitchRecallNote('C4');
    store.inputPitchRecallNote('D4');
    const resFinal = store.inputPitchRecallNote('G4'); // C4 D4 G4 != C4 E4 G4

    expect(resFinal).not.toBeNull();
    expect(resFinal!.isCorrect).toBe(false);
    expect(useAppStore.getState().officeQuestionState).toBe('freestyle');
    expect(useAppStore.getState().officeSession.wrongCount).toBe(1);
  });

  it('manages office pop-up open, close, and toggle state properly', () => {
    const store = useAppStore.getState();
    expect(store.isOfficePopUpOpen).toBe(false);

    // Open pop-up: should activate office mode and set exercise slug to pitch-recall
    store.openOfficePopUp();
    let state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(true);
    expect(state.officeModeActive).toBe(true);
    expect(state.officeSettings.exerciseSlug).toBe('pitch-recall');

    // Close pop-up
    store.closeOfficePopUp();
    state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(false);

    // Toggle pop-up
    store.toggleOfficePopUp();
    state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(true);
    expect(state.officeSettings.exerciseSlug).toBe('pitch-recall');

    // Toggle pop-up: when open, toggle minimizes it (—) rather than destroying it
    store.toggleOfficePopUp();
    state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(true);
    expect(state.isOfficePopUpMinimized).toBe(true);

    // Toggle pop-up again: restores it
    store.toggleOfficePopUp();
    state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(true);
    expect(state.isOfficePopUpMinimized).toBe(false);

    // Explicit close closes it completely
    store.closeOfficePopUp();
    state = useAppStore.getState();
    expect(state.isOfficePopUpOpen).toBe(false);
    expect(state.isOfficePopUpMinimized).toBe(false);
  });

  it('configures and swaps Bluetooth earbud touch actions flexibly', () => {
    const store = useAppStore.getState();

    // Default right-hand profile
    expect(store.officeSettings.earbudProfile).toBe('right-hand');
    expect(store.officeSettings.earbudDoubleTapRightAction).toBe('next-question');
    expect(store.officeSettings.earbudDoubleTapLeftAction).toBe('replay-focus');

    // Switch to left-hand profile
    store.setEarbudProfile('left-hand');
    let state = useAppStore.getState();
    expect(state.officeSettings.earbudProfile).toBe('left-hand');
    expect(state.officeSettings.earbudDoubleTapRightAction).toBe('replay-focus');
    expect(state.officeSettings.earbudDoubleTapLeftAction).toBe('next-question');

    // Swap Left and Right
    store.swapEarbudActions();
    state = useAppStore.getState();
    expect(state.officeSettings.earbudProfile).toBe('custom');
    expect(state.officeSettings.earbudDoubleTapRightAction).toBe('next-question');
    expect(state.officeSettings.earbudDoubleTapLeftAction).toBe('replay-focus');
  });
});
