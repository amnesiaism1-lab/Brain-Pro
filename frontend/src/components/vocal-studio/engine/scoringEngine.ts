/**
 * Scoring Engine for Vocal Studio
 * Fixes DEF-03 & DEF-08: Time-based scoring (dtMs) instead of render count
 */

export interface ISingSessionAccumulator {
  totalVocalFrames: number;
  inTuneFrames: number;
  flatFrames: number;
  sharpFrames: number;

  totalSingingMs: number;
  inTuneMs: number;
  flatMs: number;
  sharpMs: number;

  highestStreakMs: number;
  currentStreakMs: number;

  phraseScores: Record<number, { totalMs: number; inTuneMs: number }>;
}

export function createSessionAccumulator(): ISingSessionAccumulator {
  return {
    totalVocalFrames: 0,
    inTuneFrames: 0,
    flatFrames: 0,
    sharpFrames: 0,
    totalSingingMs: 0,
    inTuneMs: 0,
    flatMs: 0,
    sharpMs: 0,
    highestStreakMs: 0,
    currentStreakMs: 0,
    phraseScores: {},
  };
}

export function processPitchScoreFrame(
  acc: ISingSessionAccumulator,
  params: {
    dtMs: number;
    isSinging: boolean;
    isTargetVocal: boolean;
    inTune: boolean;
    centsDiff: number;
    toleranceCents: number;
    activePhraseIndex?: number | null;
  }
): void {
  const { dtMs, isSinging, isTargetVocal, inTune, centsDiff, toleranceCents, activePhraseIndex } = params;

  // Only accumulate when both user is singing AND target note is actively playing
  if (!isSinging || !isTargetVocal) {
    acc.currentStreakMs = 0;
    return;
  }

  // Cap dtMs to prevent massive jumps when tab was backgrounded (max 50ms per frame)
  const safeDtMs = Math.max(1, Math.min(50, dtMs));

  acc.totalVocalFrames++;
  acc.totalSingingMs += safeDtMs;

  if (inTune) {
    acc.inTuneFrames++;
    acc.inTuneMs += safeDtMs;
    acc.currentStreakMs += safeDtMs;
    if (acc.currentStreakMs > acc.highestStreakMs) {
      acc.highestStreakMs = acc.currentStreakMs;
    }
  } else {
    acc.currentStreakMs = 0;
    if (centsDiff < -toleranceCents) {
      acc.flatFrames++;
      acc.flatMs += safeDtMs;
    } else if (centsDiff > toleranceCents) {
      acc.sharpFrames++;
      acc.sharpMs += safeDtMs;
    }
  }

  if (activePhraseIndex != null && activePhraseIndex > 0) {
    if (!acc.phraseScores[activePhraseIndex]) {
      acc.phraseScores[activePhraseIndex] = { totalMs: 0, inTuneMs: 0 };
    }
    acc.phraseScores[activePhraseIndex].totalMs += safeDtMs;
    if (inTune) {
      acc.phraseScores[activePhraseIndex].inTuneMs += safeDtMs;
    }
  }
}

export function calculateScorePercentage(acc: ISingSessionAccumulator): number | null {
  // Return null ("—") if less than 1 second of singing data has been collected
  if (acc.totalSingingMs < 1000) {
    return null;
  }
  return Math.round((acc.inTuneMs / acc.totalSingingMs) * 100);
}
