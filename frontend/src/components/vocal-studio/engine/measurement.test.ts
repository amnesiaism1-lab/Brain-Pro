import { describe, it, expect } from 'vitest';
import { computePitchMeasurement, getPitchFeedback } from './measurement';

describe('Vocal Studio Measurement & Feedback Engine', () => {
  it('TC-01: When silence / not singing, returns NO_VOICE and NEVER says "Chuẩn cao độ!"', () => {
    const state = computePitchMeasurement({
      isSinging: false,
      userFreqHz: 0,
      userMidi: 0,
      targetRefMidi: 65, // F4
      isTargetVocal: true,
      toleranceCents: 35,
      smartOctaveFold: true,
      centsDiff: 0,
    });

    expect(state.status).toBe('NO_VOICE');
    const feedback = getPitchFeedback(state, 35);
    expect(feedback.status).toBe('silence');
    expect(feedback.text).toBe('Đang lắng nghe...');
    expect(feedback.text).not.toContain('Chuẩn');
  });

  it('When reference note is silence / break, returns NO_TARGET and NEVER says "Chuẩn cao độ!"', () => {
    const state = computePitchMeasurement({
      isSinging: true,
      userFreqHz: 440,
      userMidi: 69,
      targetRefMidi: 0,
      isTargetVocal: false,
      toleranceCents: 35,
      smartOctaveFold: true,
      centsDiff: 0,
    });

    expect(state.status).toBe('NO_TARGET');
    const feedback = getPitchFeedback(state, 35);
    expect(feedback.status).toBe('no_target');
    expect(feedback.text).not.toContain('Chuẩn');
  });

  it('TC-03: When singing G2 (95.7 Hz) against F4 (MIDI 65), returns MEASURED with flat/sharp out of tolerance', () => {
    const state = computePitchMeasurement({
      isSinging: true,
      userFreqHz: 95.7,
      userMidi: 42.6,
      targetRefMidi: 65,
      isTargetVocal: true,
      toleranceCents: 35,
      smartOctaveFold: true,
      centsDiff: 160,
    });

    expect(state.status).toBe('MEASURED');
    if (state.status === 'MEASURED') {
      expect(state.inTolerance).toBe(false);
      expect(state.centsDiff).toBe(160);
    }

    const feedback = getPitchFeedback(state, 35);
    expect(feedback.status).toBe('sharp');
    expect(feedback.text).toContain('Hơi cao');
  });

  it('When within tolerance, returns in_tune and "Chuẩn cao độ!"', () => {
    const state = computePitchMeasurement({
      isSinging: true,
      userFreqHz: 349.2,
      userMidi: 65,
      targetRefMidi: 65,
      isTargetVocal: true,
      toleranceCents: 35,
      smartOctaveFold: true,
      centsDiff: 2,
    });

    expect(state.status).toBe('MEASURED');
    if (state.status === 'MEASURED') {
      expect(state.inTolerance).toBe(true);
    }

    const feedback = getPitchFeedback(state, 35);
    expect(feedback.status).toBe('in_tune');
    expect(feedback.text).toBe('Chuẩn cao độ!');
  });
});
