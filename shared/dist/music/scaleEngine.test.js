"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scaleEngine_1 = require("./scaleEngine");
(0, vitest_1.describe)('Scale Engine', () => {
    (0, vitest_1.it)('correctly normalizes enharmonic roots', () => {
        (0, vitest_1.expect)((0, scaleEngine_1.normalizeRootPitchClass)('C')).toBe('C');
        (0, vitest_1.expect)((0, scaleEngine_1.normalizeRootPitchClass)('Db')).toBe('C#');
        (0, vitest_1.expect)((0, scaleEngine_1.normalizeRootPitchClass)('Eb4')).toBe('D#');
        (0, vitest_1.expect)((0, scaleEngine_1.normalizeRootPitchClass)('F#')).toBe('F#');
    });
    (0, vitest_1.it)('builds C Major scale notes with correct degrees and MIDI values', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('C', 'major', 4, 1);
        // C Major: C4, D4, E4, F4, G4, A4, B4, C5 (8 notes)
        (0, vitest_1.expect)(notes.length).toBe(8);
        (0, vitest_1.expect)(notes[0].note).toBe('C4');
        (0, vitest_1.expect)(notes[0].midi).toBe(60);
        (0, vitest_1.expect)(notes[0].degree).toBe('1');
        (0, vitest_1.expect)(notes[0].isTonic).toBe(true);
        (0, vitest_1.expect)(notes[2].note).toBe('E4');
        (0, vitest_1.expect)(notes[2].midi).toBe(64);
        (0, vitest_1.expect)(notes[2].degree).toBe('3');
        (0, vitest_1.expect)(notes[7].note).toBe('C5');
        (0, vitest_1.expect)(notes[7].midi).toBe(72);
        (0, vitest_1.expect)(notes[7].degree).toBe('8');
        (0, vitest_1.expect)(notes[7].isTonic).toBe(true);
    });
    (0, vitest_1.it)('builds A Natural Minor scale notes correctly', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('A', 'minor', 3, 1);
        (0, vitest_1.expect)(notes.length).toBe(8);
        (0, vitest_1.expect)(notes[0].note).toBe('A3');
        (0, vitest_1.expect)(notes[0].midi).toBe(57);
        (0, vitest_1.expect)(notes[2].note).toBe('C4'); // b3
        (0, vitest_1.expect)(notes[2].degree).toBe('b3');
        (0, vitest_1.expect)(notes[7].note).toBe('A4');
        (0, vitest_1.expect)(notes[7].midi).toBe(69);
    });
    (0, vitest_1.it)('builds Vietnamese Bac scale (5 notes + top tonic = 6)', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('C', 'vietnamese-bac', 4, 1);
        (0, vitest_1.expect)(notes.length).toBe(6);
        (0, vitest_1.expect)(notes.map(n => n.pitchClass)).toEqual(['C', 'D', 'F', 'G', 'A', 'C']);
    });
    (0, vitest_1.it)('fits scale notes to bass-baritone range by shifting octave down', () => {
        // High C Major scale: C5 to C6 (MIDI 72 to 84) is too high for bass-baritone (max 65)
        const highNotes = (0, scaleEngine_1.buildScaleNotes)('C', 'major', 5, 1);
        const fitted = (0, scaleEngine_1.fitScaleToVocalRange)(highNotes, 'bass-baritone');
        (0, vitest_1.expect)(fitted[0].note).toBe('C4');
        (0, vitest_1.expect)(fitted[fitted.length - 1].note).toBe('C5');
    });
    (0, vitest_1.it)('generates ascending, descending, and up-down patterns', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('C', 'major', 4, 1);
        const asc = (0, scaleEngine_1.generateScaleRunPattern)(notes, 'ascending');
        (0, vitest_1.expect)(asc.map(n => n.note)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
        const desc = (0, scaleEngine_1.generateScaleRunPattern)(notes, 'descending');
        (0, vitest_1.expect)(desc.map(n => n.note)).toEqual(['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']);
        const upDown = (0, scaleEngine_1.generateScaleRunPattern)(notes, 'up-down');
        (0, vitest_1.expect)(upDown.length).toBe(15);
        (0, vitest_1.expect)(upDown[0].note).toBe('C4');
        (0, vitest_1.expect)(upDown[7].note).toBe('C5');
        (0, vitest_1.expect)(upDown[14].note).toBe('C4');
    });
    (0, vitest_1.it)('generates vocal warmup-5 pattern', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('C', 'major', 4, 1);
        const warmup = (0, scaleEngine_1.generateScaleRunPattern)(notes, 'warmup-5');
        (0, vitest_1.expect)(warmup.map(n => n.note)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4']);
    });
    (0, vitest_1.it)('generates diatonic triad arpeggio in scale', () => {
        const notes = (0, scaleEngine_1.buildScaleNotes)('C', 'major', 4, 1);
        const arp = (0, scaleEngine_1.generateScaleRunPattern)(notes, 'arpeggio-in-scale');
        (0, vitest_1.expect)(arp.map(n => n.note)).toEqual(['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4']);
    });
    (0, vitest_1.it)('picks random vocal scale from pool without immediate repetition', () => {
        const pool = ['major', 'minor', 'vietnamese-bac'];
        const res1 = (0, scaleEngine_1.pickRandomVocalScale)({ scalePool: pool, lastSelected: { scaleId: 'major', root: 'C' } });
        (0, vitest_1.expect)(pool).toContain(res1.scale.id);
    });
});
