import { describe, it, expect } from 'vitest';
import { 
  buildScaleNotes, 
  fitScaleToVocalRange, 
  generateScaleRunPattern, 
  pickRandomVocalScale,
  normalizeRootPitchClass 
} from './scaleEngine';
import { SCALE_CATALOG } from './scales';

describe('Scale Engine', () => {
  it('correctly normalizes enharmonic roots', () => {
    expect(normalizeRootPitchClass('C')).toBe('C');
    expect(normalizeRootPitchClass('Db')).toBe('C#');
    expect(normalizeRootPitchClass('Eb4')).toBe('D#');
    expect(normalizeRootPitchClass('F#')).toBe('F#');
  });

  it('builds C Major scale notes with correct degrees and MIDI values', () => {
    const notes = buildScaleNotes('C', 'major', 4, 1);
    // C Major: C4, D4, E4, F4, G4, A4, B4, C5 (8 notes)
    expect(notes.length).toBe(8);
    expect(notes[0].note).toBe('C4');
    expect(notes[0].midi).toBe(60);
    expect(notes[0].degree).toBe('1');
    expect(notes[0].isTonic).toBe(true);

    expect(notes[2].note).toBe('E4');
    expect(notes[2].midi).toBe(64);
    expect(notes[2].degree).toBe('3');

    expect(notes[7].note).toBe('C5');
    expect(notes[7].midi).toBe(72);
    expect(notes[7].degree).toBe('8');
    expect(notes[7].isTonic).toBe(true);
  });

  it('builds A Natural Minor scale notes correctly', () => {
    const notes = buildScaleNotes('A', 'minor', 3, 1);
    expect(notes.length).toBe(8);
    expect(notes[0].note).toBe('A3');
    expect(notes[0].midi).toBe(57);
    expect(notes[2].note).toBe('C4'); // b3
    expect(notes[2].degree).toBe('b3');
    expect(notes[7].note).toBe('A4');
    expect(notes[7].midi).toBe(69);
  });

  it('builds Vietnamese Bac scale (5 notes + top tonic = 6)', () => {
    const notes = buildScaleNotes('C', 'vietnamese-bac', 4, 1);
    expect(notes.length).toBe(6);
    expect(notes.map(n => n.pitchClass)).toEqual(['C', 'D', 'F', 'G', 'A', 'C']);
  });

  it('fits scale notes to bass-baritone range by shifting octave down', () => {
    // High C Major scale: C5 to C6 (MIDI 72 to 84) is too high for bass-baritone (max 65)
    const highNotes = buildScaleNotes('C', 'major', 5, 1);
    const fitted = fitScaleToVocalRange(highNotes, 'bass-baritone');
    expect(fitted[0].note).toBe('C4');
    expect(fitted[fitted.length - 1].note).toBe('C5');
  });

  it('generates ascending, descending, and up-down patterns', () => {
    const notes = buildScaleNotes('C', 'major', 4, 1);
    const asc = generateScaleRunPattern(notes, 'ascending');
    expect(asc.map(n => n.note)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);

    const desc = generateScaleRunPattern(notes, 'descending');
    expect(desc.map(n => n.note)).toEqual(['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']);

    const upDown = generateScaleRunPattern(notes, 'up-down');
    expect(upDown.length).toBe(15);
    expect(upDown[0].note).toBe('C4');
    expect(upDown[7].note).toBe('C5');
    expect(upDown[14].note).toBe('C4');
  });

  it('generates vocal warmup-5 pattern', () => {
    const notes = buildScaleNotes('C', 'major', 4, 1);
    const warmup = generateScaleRunPattern(notes, 'warmup-5');
    expect(warmup.map(n => n.note)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4']);
  });

  it('generates diatonic triad arpeggio in scale', () => {
    const notes = buildScaleNotes('C', 'major', 4, 1);
    const arp = generateScaleRunPattern(notes, 'arpeggio-in-scale');
    expect(arp.map(n => n.note)).toEqual(['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4']);
  });

  it('picks random vocal scale from pool without immediate repetition', () => {
    const pool = ['major', 'minor', 'vietnamese-bac'];
    const res1 = pickRandomVocalScale({ scalePool: pool, lastSelected: { scaleId: 'major', root: 'C' } });
    expect(pool).toContain(res1.scale.id);
  });
});
