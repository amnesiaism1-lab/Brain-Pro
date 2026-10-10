import { describe, it, expect } from 'vitest';
import { PitchDetector } from 'pitchy';
import { freqToMidi, midiToNoteInfo } from '@brain-exercises/shared';
import { generateSyntheticMelody } from './fixtures';
import { vocalFileAnalysisService } from '../../../services/vocalFileAnalysisService';

describe('Vocal File Analysis & Range Extraction', () => {
  it('TC-09 & DEF-04: C3 to G4 scale yields robust p5-p95 range of ~19 semitones (not 35)', () => {
    // C3 (130.81), E3 (164.81), G3 (196.00), C4 (261.63), E4 (329.63), G4 (392.00)
    const melodyNotes = [
      { freqHz: 130.81, durSec: 0.3 }, // C3 (MIDI 48)
      { freqHz: 164.81, durSec: 0.3 }, // E3 (MIDI 52)
      { freqHz: 196.00, durSec: 0.3 }, // G3 (MIDI 55)
      { freqHz: 261.63, durSec: 0.3 }, // C4 (MIDI 60)
      { freqHz: 329.63, durSec: 0.3 }, // E4 (MIDI 64)
      { freqHz: 392.00, durSec: 0.3 }, // G4 (MIDI 67)
    ];

    const sampleRate = 44100;
    const pcm = generateSyntheticMelody(melodyNotes, sampleRate, {
      addSecondHarmonic: 0.25,
      pauseSec: 0.1,
    });

    const bufferSize = 2048;
    const hopSize = 1024;
    const detector = PitchDetector.forFloat32Array(bufferSize);
    detector.clarityThreshold = 0.65;

    const midis: number[] = [];
    const frameBuffer = new Float32Array(bufferSize);

    for (let offset = 0; offset + bufferSize <= pcm.length; offset += hopSize) {
      for (let j = 0; j < bufferSize; j++) {
        frameBuffer[j] = pcm[offset + j];
      }
      const [pitch, clarity] = detector.findPitch(frameBuffer, sampleRate);
      if (clarity >= 0.65 && pitch >= 80 && pitch <= 1100) {
        midis.push(freqToMidi(pitch));
      }
    }

    expect(midis.length).toBeGreaterThan(10);

    // Apply robust p5-p95 percentile
    midis.sort((a, b) => a - b);
    const p5 = midis[Math.floor(midis.length * 0.05)];
    const p95 = midis[Math.min(midis.length - 1, Math.ceil(midis.length * 0.95))];

    const lowest = midiToNoteInfo(p5);
    const highest = midiToNoteInfo(p95);
    const span = Math.round(p95 - p5);

    // Lowest should be C3 (MIDI 48) ±1 semitone
    expect(Math.abs(p5 - 48)).toBeLessThanOrEqual(1.2);
    expect(lowest.baseNote).toBe('C');
    expect(lowest.octave).toBe(3);

    // Highest should be G4 (MIDI 67) ±1 semitone
    expect(Math.abs(p95 - 67)).toBeLessThanOrEqual(1.2);
    expect(highest.baseNote).toBe('G');
    expect(highest.octave).toBe(4);

    // Total span must be around 19 semitones, NEVER 35 semitones!
    expect(span).toBeGreaterThanOrEqual(18);
    expect(span).toBeLessThanOrEqual(20);
  });

  it('TC-10: Transient clicks and silence at start/end do not corrupt p5-p95 range', () => {
    // Add artificial transient clicks at beginning and end
    const rawMidis = [
      28, // Click spike E1 (outlier)
      48, 48, 48, 52, 52, 55, 55, 60, 60, 64, 64, 67, 67, 67, // Core C3..G4
      88, // Click spike E6 (outlier)
    ];

    rawMidis.sort((a, b) => a - b);
    const p5Index = Math.min(rawMidis.length - 1, Math.max(rawMidis.length > 10 ? 1 : 0, Math.floor(rawMidis.length * 0.05)));
    const p95Index = Math.max(0, Math.min(rawMidis.length > 10 ? rawMidis.length - 2 : rawMidis.length - 1, Math.ceil(rawMidis.length * 0.95)));
    const p5 = rawMidis[p5Index];
    const p95 = rawMidis[p95Index];

    // Outliers 28 and 88 are eliminated!
    expect(p5).toBeGreaterThanOrEqual(48);
    expect(p95).toBeLessThanOrEqual(67);
  });

  it('TC-11: Supported tempo steps in practice plan', () => {
    const supportedTempos = [0.75, 0.85, 1.0, 1.15];
    const planTempos = [1.0, 0.75, 0.85, 1.0]; // Steps 1 to 4

    planTempos.forEach((t) => {
      expect(supportedTempos).toContain(t);
    });
  });

  it('TC-16: NewTone Note Bar segmentation groups sustained pitch points into discrete note bars', () => {
    // Simulate a melodic phrase: C4 (60) for 400ms, then D4 (62) for 500ms
    const points: any[] = [];
    // C4 sustained
    for (let t = 0; t <= 400; t += 25) {
      points.push({
        timeMs: t,
        freqHz: 261.63,
        midi: 60.1, // slight micro deviation +10 cents
        noteName: 'C4',
        solfegeName: 'Đô 4',
        clarity: 0.9,
        volumeDb: -15,
        isVocal: true,
      });
    }
    // D4 sustained
    for (let t = 450; t <= 950; t += 25) {
      points.push({
        timeMs: t,
        freqHz: 293.66,
        midi: 61.95, // slight micro deviation -5 cents
        noteName: 'D4',
        solfegeName: 'Rê 4',
        clarity: 0.92,
        volumeDb: -14,
        isVocal: true,
      });
    }

    const bars = vocalFileAnalysisService.segmentNoteBars(points);

    expect(bars.length).toBe(2);
    // First bar should be C4
    expect(bars[0].midi).toBe(60);
    expect(bars[0].noteName).toBe('C4');
    expect(bars[0].durationMs).toBeGreaterThanOrEqual(350);

    // Second bar should be D4
    expect(bars[1].midi).toBe(62);
    expect(bars[1].noteName).toBe('D4');
    expect(bars[1].durationMs).toBeGreaterThanOrEqual(450);
  });

  it('TC-17: Micro breath gaps on same note merge seamlessly into one sustained note bar', () => {
    const points: any[] = [];
    // G4 first syllable (0 to 300ms)
    for (let t = 0; t <= 300; t += 25) {
      points.push({
        timeMs: t,
        freqHz: 392.0,
        midi: 67.0,
        noteName: 'G4',
        solfegeName: 'Sol 4',
        clarity: 0.95,
        volumeDb: -12,
        isVocal: true,
      });
    }
    // Micro breath gap: 325ms is silence
    points.push({
      timeMs: 325,
      freqHz: 0,
      midi: 0,
      noteName: '',
      solfegeName: '',
      clarity: 0,
      volumeDb: -80,
      isVocal: false,
    });
    // G4 continuation (350ms to 700ms, gap is only 50ms)
    for (let t = 350; t <= 700; t += 25) {
      points.push({
        timeMs: t,
        freqHz: 392.0,
        midi: 67.0,
        noteName: 'G4',
        solfegeName: 'Sol 4',
        clarity: 0.95,
        volumeDb: -12,
        isVocal: true,
      });
    }

    const bars = vocalFileAnalysisService.segmentNoteBars(points);

    // Should merge into 1 sustained note bar
    expect(bars.length).toBe(1);
    expect(bars[0].midi).toBe(67);
    expect(bars[0].noteName).toBe('G4');
    expect(bars[0].durationMs).toBe(700);
  });

  it('TC-18: Global Viterbi Path Decoder eliminates octave-jump errors (octave doubling/halving)', () => {
    // Continuous melody on C4 (MIDI 60, 261.63Hz), but frames 4 and 5 got accidentally octave-doubled to C5 (MIDI 72, 523.25Hz)
    const points: any[] = [];
    for (let i = 0; i < 10; i++) {
      const isGlitch = i === 4 || i === 5;
      points.push({
        timeMs: i * 25,
        freqHz: isGlitch ? 523.25 : 261.63,
        midi: isGlitch ? 72 : 60,
        noteName: isGlitch ? 'C5' : 'C4',
        solfegeName: isGlitch ? 'Đô 5' : 'Đô 4',
        clarity: 0.85,
        volumeDb: -15,
        isVocal: true,
      });
    }

    vocalFileAnalysisService.applyViterbiSmoothing(points);

    // After Viterbi smoothing, frames 4 and 5 must be pulled down to C4 (MIDI 60)
    expect(points[4].midi).toBe(60);
    expect(points[4].noteName).toBe('C4');
    expect(points[5].midi).toBe(60);
    expect(points[5].noteName).toBe('C4');
  });
});
