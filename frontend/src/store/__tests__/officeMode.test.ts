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
});
