import { describe, it, expect, beforeEach } from 'vitest';
import { useVocalStudioStore } from '../vocalStudioStore';

describe('vocalStudioStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVocalStudioStore.getState().closeStudio();
    useVocalStudioStore.getState().resetSessionStats();
    useVocalStudioStore.getState().setToleranceCents(35);
    useVocalStudioStore.getState().setTargetMode('quantized');
    useVocalStudioStore.getState().setSmartOctaveFold(true);
    useVocalStudioStore.getState().setPlaybackSpeed(1.0);
  });

  it('initializes with expected default preferences', () => {
    const state = useVocalStudioStore.getState();
    expect(state.toleranceCents).toBe(35);
    expect(state.targetMode).toBe('quantized');
    expect(state.smartOctaveFold).toBe(true);
    expect(state.playbackSpeed).toBe(1.0);
    expect(state.concertA4Hz).toBe(440);
    expect(state.isWindowLocked).toBe(false);
  });

  it('updates tolerance cents across 4 tiers (10, 20, 35, 50)', () => {
    const store = useVocalStudioStore.getState();

    store.setToleranceCents(10);
    expect(useVocalStudioStore.getState().toleranceCents).toBe(10);

    store.setToleranceCents(50);
    expect(useVocalStudioStore.getState().toleranceCents).toBe(50);

    store.setToleranceCents(20);
    expect(useVocalStudioStore.getState().toleranceCents).toBe(20);
  });

  it('toggles target guidance mode between quantized and original', () => {
    const store = useVocalStudioStore.getState();

    store.setTargetMode('original');
    expect(useVocalStudioStore.getState().targetMode).toBe('original');

    store.setTargetMode('quantized');
    expect(useVocalStudioStore.getState().targetMode).toBe('quantized');
  });

  it('handles playback speed updates and presets smoothly', () => {
    const store = useVocalStudioStore.getState();

    store.setPlaybackSpeed(0.85);
    expect(useVocalStudioStore.getState().playbackSpeed).toBe(0.85);

    store.setPlaybackSpeed(1.15);
    expect(useVocalStudioStore.getState().playbackSpeed).toBe(1.15);
  });

  it('handles loop setting and clearing', () => {
    const store = useVocalStudioStore.getState();

    store.setLoop(1500, 4200, 2);
    expect(useVocalStudioStore.getState().isLoopingActive).toBe(true);
    expect(useVocalStudioStore.getState().loopStartMs).toBe(1500);
    expect(useVocalStudioStore.getState().loopEndMs).toBe(4200);
    expect(useVocalStudioStore.getState().selectedPhraseIndex).toBe(2);

    store.clearLoop();
    expect(useVocalStudioStore.getState().isLoopingActive).toBe(false);
    expect(useVocalStudioStore.getState().loopStartMs).toBeNull();
    expect(useVocalStudioStore.getState().loopEndMs).toBeNull();
    expect(useVocalStudioStore.getState().selectedPhraseIndex).toBeNull();
  });

  it('resets session stats correctly', () => {
    const store = useVocalStudioStore.getState();
    store.setCurrentStreak(12);
    store.setRealtimeScorePct(88);

    store.resetSessionStats();
    expect(useVocalStudioStore.getState().currentStreak).toBe(0);
    expect(useVocalStudioStore.getState().realtimeScorePct).toBeNull();
  });
});
