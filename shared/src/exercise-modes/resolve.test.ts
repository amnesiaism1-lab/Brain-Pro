import { describe, it, expect } from 'vitest';
import { resolveSessionConfig, inferModeIdForLadderLevel } from './resolve';
import { ICustomExercisePreset } from './types';
import { IVocalScaleParams } from './modes/vocal-pitch-match';

describe('Resolve Session Config', () => {
  it('correctly infers modeId for vocal-pitch-match ladder levels', () => {
    // Level 1: single note
    expect(inferModeIdForLadderLevel('vocal-pitch-match', { level: 1, timeLimitSec: 45, parametersJson: { sequenceType: 'single' } })).toBe('vocal.single-note');
    // Level 5: interval
    expect(inferModeIdForLadderLevel('vocal-pitch-match', { level: 5, timeLimitSec: 50, parametersJson: { sequenceType: 'interval' } })).toBe('vocal.interval');
    // Level 7: arpeggio
    expect(inferModeIdForLadderLevel('vocal-pitch-match', { level: 7, timeLimitSec: 55, parametersJson: { sequenceType: 'arpeggio' } })).toBe('vocal.arpeggio');
    // Level 9: scale
    expect(inferModeIdForLadderLevel('vocal-pitch-match', { level: 9, timeLimitSec: 60, parametersJson: { sequenceType: 'scale' } })).toBe('vocal.scale');
  });

  it('resolves ladder configuration when no custom preset is provided', () => {
    const resolved = resolveSessionConfig('vocal-pitch-match', 1);
    expect(resolved.source).toBe('ladder');
    expect(resolved.level).toBe(1);
    expect(resolved.modeId).toBe('vocal.single-note');
    expect(resolved.rounds).toBeGreaterThanOrEqual(1);
    expect(resolved.timeLimitSec).toBeGreaterThan(0);
  });

  it('resolves custom preset overriding ladder parameters', () => {
    const customPreset: ICustomExercisePreset = {
      id: 'custom-scale-test',
      exerciseSlug: 'vocal-pitch-match',
      modeId: 'vocal.scale',
      name: 'Custom Scale Workout',
      schemaVersion: 1,
      params: {
        scaleSelection: 'fixed',
        scaleId: 'vietnamese-oan',
        rootSelection: 'fixed',
        root: 'D',
        pattern: 'warmup-5',
        centsTolerance: 20,
        holdDurationMs: 1500
      },
      session: {
        rounds: 5,
        timeLimitSec: null // Free play
      },
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z'
    };

    const resolved = resolveSessionConfig<IVocalScaleParams>('vocal-pitch-match', 1, customPreset);
    expect(resolved.source).toBe('custom');
    expect(resolved.modeId).toBe('vocal.scale');
    expect(resolved.presetId).toBe('custom-scale-test');
    expect(resolved.rounds).toBe(5);
    expect(resolved.timeLimitSec).toBeNull();
    expect(resolved.params.scaleSelection).toBe('fixed');
    expect(resolved.params.scaleId).toBe('vietnamese-oan');
    expect(resolved.params.pattern).toBe('warmup-5');
  });
});
