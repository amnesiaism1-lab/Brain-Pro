import { describe, it, expect } from 'vitest';
import {
  freqToMidi,
  midiToFreq,
  centsDiff,
  foldCents,
  freqToNote,
  midiToNoteInfo,
  foldMidiToTargetOctave,
  evaluateCentsDeviation,
} from './pitch';

describe('Unified Music Pitch Utilities', () => {
  it('TC-02: Sin 349.23 Hz matches target F4 (MIDI 65) within ±3 cents', () => {
    const midi = freqToMidi(349.23);
    expect(midi).toBeCloseTo(65, 1);

    const evalResult = evaluateCentsDeviation(349.23, 65, { smartOctaveFold: true });
    expect(Math.abs(evalResult.centsDiff)).toBeLessThanOrEqual(3);
  });

  it('TC-03: Sin 95.7 Hz with Fold ON against target F4 (MIDI 65) results in ~+160 cents (OUT of tolerance)', () => {
    // 95.7 Hz is approx MIDI 42.6 (G2 - 39 cents).
    // Target F4 is MIDI 65.
    // Transposed target to octave 2 is MIDI 41 (F2).
    // Deviation is 42.6 - 41 = +1.6 semitones (+160 cents).
    const evalResult = evaluateCentsDeviation(95.7, 65, { smartOctaveFold: true });
    expect(evalResult.centsDiff).toBeGreaterThan(150);
    expect(evalResult.centsDiff).toBeLessThan(170);

    // Tolerance of ±35 or ±50 cents MUST NOT match
    expect(Math.abs(evalResult.centsDiff) <= 35).toBe(false);
    expect(Math.abs(evalResult.centsDiff) <= 50).toBe(false);
  });

  it('TC-04: Boundary tolerance checking for ±20 cents', () => {
    const targetMidi = 69; // A4 (440 Hz)
    const freq19 = midiToFreq(69.19);
    const freq20 = midiToFreq(69.20);
    const freq21 = midiToFreq(69.21);

    const res19 = evaluateCentsDeviation(freq19, targetMidi);
    const res20 = evaluateCentsDeviation(freq20, targetMidi);
    const res21 = evaluateCentsDeviation(freq21, targetMidi);

    expect(Math.abs(res19.centsDiff) <= 20).toBe(true);
    expect(Math.abs(res20.centsDiff) <= 20).toBe(true);
    expect(Math.abs(res21.centsDiff) <= 20).toBe(false);
  });

  it('TC-05: F2, F3, F4, F5 with Fold ON all yield centsDiff ~ 0 against F4', () => {
    const f2 = midiToFreq(41); // F2
    const f3 = midiToFreq(53); // F3
    const f4 = midiToFreq(65); // F4
    const f5 = midiToFreq(77); // F5

    [f2, f3, f4, f5].forEach((freq) => {
      const resFold = evaluateCentsDeviation(freq, 65, { smartOctaveFold: true });
      expect(Math.abs(resFold.centsDiff)).toBe(0);
    });

    // With fold OFF, only F4 has 0 cents diff
    const resFoldOffF3 = evaluateCentsDeviation(f3, 65, { smartOctaveFold: false });
    expect(resFoldOffF3.centsDiff).toBe(-1200);

    const resFoldOffF5 = evaluateCentsDeviation(f5, 65, { smartOctaveFold: false });
    expect(resFoldOffF5.centsDiff).toBe(1200);
  });

  it('TC-06: foldCents properly handles ±600 cents boundary and wrap-around', () => {
    expect(foldCents(0)).toBe(0);
    expect(foldCents(50)).toBe(50);
    expect(foldCents(-50)).toBe(-50);
    expect(foldCents(590)).toBe(590);
    expect(foldCents(-590)).toBe(-590);

    // +610 cents wraps to -590 cents
    expect(foldCents(610)).toBe(-590);
    // -610 cents wraps to +590 cents
    expect(foldCents(-610)).toBe(590);
    // +1200 cents wraps to 0
    expect(foldCents(1200)).toBe(0);
    // -1200 cents wraps to 0
    expect(foldCents(-1200)).toBe(0);
  });

  it('TC-07: Consistent note naming for 95.7 Hz (G2, Sol 2, pitchClass 7)', () => {
    const noteInfo = freqToNote(95.7);
    expect(noteInfo.baseNote).toBe('G');
    expect(noteInfo.solfegeBase).toBe('Sol');
    expect(noteInfo.octave).toBe(2);
    expect(noteInfo.noteName).toBe('G2');
    expect(noteInfo.solfegeName).toBe('Sol 2');
    expect(noteInfo.pitchClass).toBe(7); // G is index 7 in NOTE_NAMES
    expect(noteInfo.midiNumber).toBe(43); // 42.59 rounded is 43 (G2)
    expect(noteInfo.centsDeviation).toBe(-41); // G2 - 41 cents
  });

  it('Handles edge cases: zero or negative frequency', () => {
    const zeroInfo = freqToNote(0);
    expect(zeroInfo.noteName).toBe('');
    expect(freqToMidi(0)).toBe(0);
    expect(centsDiff(0, 440)).toBe(0);
  });
});
