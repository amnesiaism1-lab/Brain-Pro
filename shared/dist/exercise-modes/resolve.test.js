"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolve_1 = require("./resolve");
(0, vitest_1.describe)('Resolve Session Config', () => {
    (0, vitest_1.it)('correctly infers modeId for vocal-pitch-match ladder levels', () => {
        // Level 1: single note
        (0, vitest_1.expect)((0, resolve_1.inferModeIdForLadderLevel)('vocal-pitch-match', { level: 1, timeLimitSec: 45, parametersJson: { sequenceType: 'single' } })).toBe('vocal.single-note');
        // Level 5: interval
        (0, vitest_1.expect)((0, resolve_1.inferModeIdForLadderLevel)('vocal-pitch-match', { level: 5, timeLimitSec: 50, parametersJson: { sequenceType: 'interval' } })).toBe('vocal.interval');
        // Level 7: arpeggio
        (0, vitest_1.expect)((0, resolve_1.inferModeIdForLadderLevel)('vocal-pitch-match', { level: 7, timeLimitSec: 55, parametersJson: { sequenceType: 'arpeggio' } })).toBe('vocal.arpeggio');
        // Level 9: scale
        (0, vitest_1.expect)((0, resolve_1.inferModeIdForLadderLevel)('vocal-pitch-match', { level: 9, timeLimitSec: 60, parametersJson: { sequenceType: 'scale' } })).toBe('vocal.scale');
    });
    (0, vitest_1.it)('resolves ladder configuration when no custom preset is provided', () => {
        const resolved = (0, resolve_1.resolveSessionConfig)('vocal-pitch-match', 1);
        (0, vitest_1.expect)(resolved.source).toBe('ladder');
        (0, vitest_1.expect)(resolved.level).toBe(1);
        (0, vitest_1.expect)(resolved.modeId).toBe('vocal.single-note');
        (0, vitest_1.expect)(resolved.rounds).toBeGreaterThanOrEqual(1);
        (0, vitest_1.expect)(resolved.timeLimitSec).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('resolves custom preset overriding ladder parameters', () => {
        const customPreset = {
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
        const resolved = (0, resolve_1.resolveSessionConfig)('vocal-pitch-match', 1, customPreset);
        (0, vitest_1.expect)(resolved.source).toBe('custom');
        (0, vitest_1.expect)(resolved.modeId).toBe('vocal.scale');
        (0, vitest_1.expect)(resolved.presetId).toBe('custom-scale-test');
        (0, vitest_1.expect)(resolved.rounds).toBe(5);
        (0, vitest_1.expect)(resolved.timeLimitSec).toBeNull();
        (0, vitest_1.expect)(resolved.params.scaleSelection).toBe('fixed');
        (0, vitest_1.expect)(resolved.params.scaleId).toBe('vietnamese-oan');
        (0, vitest_1.expect)(resolved.params.pattern).toBe('warmup-5');
    });
});
