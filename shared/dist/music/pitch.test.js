"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pitch_1 = require("./pitch");
(0, vitest_1.describe)('Unified Music Pitch Utilities', () => {
    (0, vitest_1.it)('TC-02: Sin 349.23 Hz matches target F4 (MIDI 65) within ±3 cents', () => {
        const midi = (0, pitch_1.freqToMidi)(349.23);
        (0, vitest_1.expect)(midi).toBeCloseTo(65, 1);
        const evalResult = (0, pitch_1.evaluateCentsDeviation)(349.23, 65, { smartOctaveFold: true });
        (0, vitest_1.expect)(Math.abs(evalResult.centsDiff)).toBeLessThanOrEqual(3);
    });
    (0, vitest_1.it)('TC-03: Sin 95.7 Hz with Fold ON against target F4 (MIDI 65) results in ~+160 cents (OUT of tolerance)', () => {
        // 95.7 Hz is approx MIDI 42.6 (G2 - 39 cents).
        // Target F4 is MIDI 65.
        // Transposed target to octave 2 is MIDI 41 (F2).
        // Deviation is 42.6 - 41 = +1.6 semitones (+160 cents).
        const evalResult = (0, pitch_1.evaluateCentsDeviation)(95.7, 65, { smartOctaveFold: true });
        (0, vitest_1.expect)(evalResult.centsDiff).toBeGreaterThan(150);
        (0, vitest_1.expect)(evalResult.centsDiff).toBeLessThan(170);
        // Tolerance of ±35 or ±50 cents MUST NOT match
        (0, vitest_1.expect)(Math.abs(evalResult.centsDiff) <= 35).toBe(false);
        (0, vitest_1.expect)(Math.abs(evalResult.centsDiff) <= 50).toBe(false);
    });
    (0, vitest_1.it)('TC-04: Boundary tolerance checking for ±20 cents', () => {
        const targetMidi = 69; // A4 (440 Hz)
        const freq19 = (0, pitch_1.midiToFreq)(69.19);
        const freq20 = (0, pitch_1.midiToFreq)(69.20);
        const freq21 = (0, pitch_1.midiToFreq)(69.21);
        const res19 = (0, pitch_1.evaluateCentsDeviation)(freq19, targetMidi);
        const res20 = (0, pitch_1.evaluateCentsDeviation)(freq20, targetMidi);
        const res21 = (0, pitch_1.evaluateCentsDeviation)(freq21, targetMidi);
        (0, vitest_1.expect)(Math.abs(res19.centsDiff) <= 20).toBe(true);
        (0, vitest_1.expect)(Math.abs(res20.centsDiff) <= 20).toBe(true);
        (0, vitest_1.expect)(Math.abs(res21.centsDiff) <= 20).toBe(false);
    });
    (0, vitest_1.it)('TC-05: F2, F3, F4, F5 with Fold ON all yield centsDiff ~ 0 against F4', () => {
        const f2 = (0, pitch_1.midiToFreq)(41); // F2
        const f3 = (0, pitch_1.midiToFreq)(53); // F3
        const f4 = (0, pitch_1.midiToFreq)(65); // F4
        const f5 = (0, pitch_1.midiToFreq)(77); // F5
        [f2, f3, f4, f5].forEach((freq) => {
            const resFold = (0, pitch_1.evaluateCentsDeviation)(freq, 65, { smartOctaveFold: true });
            (0, vitest_1.expect)(Math.abs(resFold.centsDiff)).toBe(0);
        });
        // With fold OFF, only F4 has 0 cents diff
        const resFoldOffF3 = (0, pitch_1.evaluateCentsDeviation)(f3, 65, { smartOctaveFold: false });
        (0, vitest_1.expect)(resFoldOffF3.centsDiff).toBe(-1200);
        const resFoldOffF5 = (0, pitch_1.evaluateCentsDeviation)(f5, 65, { smartOctaveFold: false });
        (0, vitest_1.expect)(resFoldOffF5.centsDiff).toBe(1200);
    });
    (0, vitest_1.it)('TC-06: foldCents properly handles ±600 cents boundary and wrap-around', () => {
        (0, vitest_1.expect)((0, pitch_1.foldCents)(0)).toBe(0);
        (0, vitest_1.expect)((0, pitch_1.foldCents)(50)).toBe(50);
        (0, vitest_1.expect)((0, pitch_1.foldCents)(-50)).toBe(-50);
        (0, vitest_1.expect)((0, pitch_1.foldCents)(590)).toBe(590);
        (0, vitest_1.expect)((0, pitch_1.foldCents)(-590)).toBe(-590);
        // +610 cents wraps to -590 cents
        (0, vitest_1.expect)((0, pitch_1.foldCents)(610)).toBe(-590);
        // -610 cents wraps to +590 cents
        (0, vitest_1.expect)((0, pitch_1.foldCents)(-610)).toBe(590);
        // +1200 cents wraps to 0
        (0, vitest_1.expect)((0, pitch_1.foldCents)(1200)).toBe(0);
        // -1200 cents wraps to 0
        (0, vitest_1.expect)((0, pitch_1.foldCents)(-1200)).toBe(0);
    });
    (0, vitest_1.it)('TC-07: Consistent note naming for 95.7 Hz (G2, Sol 2, pitchClass 7)', () => {
        const noteInfo = (0, pitch_1.freqToNote)(95.7);
        (0, vitest_1.expect)(noteInfo.baseNote).toBe('G');
        (0, vitest_1.expect)(noteInfo.solfegeBase).toBe('Sol');
        (0, vitest_1.expect)(noteInfo.octave).toBe(2);
        (0, vitest_1.expect)(noteInfo.noteName).toBe('G2');
        (0, vitest_1.expect)(noteInfo.solfegeName).toBe('Sol 2');
        (0, vitest_1.expect)(noteInfo.pitchClass).toBe(7); // G is index 7 in NOTE_NAMES
        (0, vitest_1.expect)(noteInfo.midiNumber).toBe(43); // 42.59 rounded is 43 (G2)
        (0, vitest_1.expect)(noteInfo.centsDeviation).toBe(-41); // G2 - 41 cents
    });
    (0, vitest_1.it)('Handles edge cases: zero or negative frequency', () => {
        const zeroInfo = (0, pitch_1.freqToNote)(0);
        (0, vitest_1.expect)(zeroInfo.noteName).toBe('');
        (0, vitest_1.expect)((0, pitch_1.freqToMidi)(0)).toBe(0);
        (0, vitest_1.expect)((0, pitch_1.centsDiff)(0, 440)).toBe(0);
    });
});
