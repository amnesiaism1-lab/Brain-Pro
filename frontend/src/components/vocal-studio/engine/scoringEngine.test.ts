import { describe, it, expect } from 'vitest';
import { createSessionAccumulator, processPitchScoreFrame, calculateScorePercentage } from './scoringEngine';

describe('Vocal Studio Time-Based Scoring Engine', () => {
  it('TC-08: When singing less than 1 second, score returns null ("—")', () => {
    const acc = createSessionAccumulator();
    // 500ms of in-tune singing
    for (let i = 0; i < 25; i++) {
      processPitchScoreFrame(acc, {
        dtMs: 20,
        isSinging: true,
        isTargetVocal: true,
        inTune: true,
        centsDiff: 0,
        toleranceCents: 35,
      });
    }

    expect(acc.totalSingingMs).toBe(500);
    expect(calculateScorePercentage(acc)).toBeNull();
  });

  it('TC-17: 2s in-tune + 2s out-of-tune produces exactly 50% score regardless of frame rate', () => {
    const acc = createSessionAccumulator();

    // 2000ms in tune (100 frames of 20ms)
    for (let i = 0; i < 100; i++) {
      processPitchScoreFrame(acc, {
        dtMs: 20,
        isSinging: true,
        isTargetVocal: true,
        inTune: true,
        centsDiff: 5,
        toleranceCents: 35,
      });
    }

    // 2000ms out of tune (200 frames of 10ms - simulating high-frequency frames)
    for (let i = 0; i < 200; i++) {
      processPitchScoreFrame(acc, {
        dtMs: 10,
        isSinging: true,
        isTargetVocal: true,
        inTune: false,
        centsDiff: -45,
        toleranceCents: 35,
      });
    }

    expect(acc.totalSingingMs).toBe(4000);
    expect(acc.inTuneMs).toBe(2000);
    expect(acc.flatMs).toBe(2000);
    expect(calculateScorePercentage(acc)).toBe(50);
  });
});
