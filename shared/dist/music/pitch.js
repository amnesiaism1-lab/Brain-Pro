"use strict";
/**
 * Unified Music Pitch & Frequency Utility Functions
 * Single source of truth for frequency, MIDI, cents deviation, and octave folding.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOLFEGE_NAMES = exports.NOTE_NAMES = void 0;
exports.freqToMidi = freqToMidi;
exports.midiToFreq = midiToFreq;
exports.centsDiff = centsDiff;
exports.foldCents = foldCents;
exports.midiToNoteInfo = midiToNoteInfo;
exports.freqToNote = freqToNote;
exports.foldMidiToTargetOctave = foldMidiToTargetOctave;
exports.evaluateCentsDeviation = evaluateCentsDeviation;
exports.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
exports.SOLFEGE_NAMES = ['Đô', 'Đô#', 'Rê', 'Rê#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
/**
 * Convert frequency in Hz to floating-point MIDI number
 */
function freqToMidi(freqHz, a4 = 440) {
    if (freqHz <= 0 || !isFinite(freqHz))
        return 0;
    return 12 * Math.log2(freqHz / a4) + 69;
}
/**
 * Convert MIDI number to frequency in Hz
 */
function midiToFreq(midi, a4 = 440) {
    if (midi <= 0 || !isFinite(midi))
        return 0;
    return a4 * Math.pow(2, (midi - 69) / 12);
}
/**
 * Canonical cents difference between two frequencies (f / fRef)
 * Positive = sharp (higher), negative = flat (lower)
 */
function centsDiff(freqHz, refFreqHz) {
    if (freqHz <= 0 || refFreqHz <= 0 || !isFinite(freqHz) || !isFinite(refFreqHz))
        return 0;
    return 1200 * Math.log2(freqHz / refFreqHz);
}
/**
 * Mathematical octave folding of cents into the canonical range [-600, +600)
 */
function foldCents(cents) {
    if (!isFinite(cents))
        return 0;
    return (((cents + 600) % 1200 + 1200) % 1200) - 600;
}
/**
 * Convert MIDI note number to structured note naming
 */
function midiToNoteInfo(midi, a4 = 440) {
    const exactMidi = midi;
    const chosenMidi = Math.round(midi);
    const pitchClass = ((chosenMidi % 12) + 12) % 12;
    const octave = Math.floor(chosenMidi / 12) - 1;
    const baseNote = exports.NOTE_NAMES[pitchClass];
    const solfegeBase = exports.SOLFEGE_NAMES[pitchClass];
    const centsDeviation = Math.round((exactMidi - chosenMidi) * 100);
    const nearestFreqHz = Math.round(midiToFreq(chosenMidi, a4) * 100) / 100;
    return {
        noteName: `${baseNote}${octave}`,
        solfegeName: `${solfegeBase} ${octave}`,
        baseNote,
        solfegeBase,
        pitchClass,
        octave,
        midiNumber: chosenMidi,
        exactMidi: Math.round(exactMidi * 100) / 100,
        centsDeviation,
        nearestFreqHz,
    };
}
/**
 * Convert frequency in Hz to comprehensive note information with optional boundary hysteresis
 */
function freqToNote(freqHz, options = {}) {
    if (freqHz <= 0 || !isFinite(freqHz)) {
        return {
            noteName: '',
            solfegeName: '',
            baseNote: 'C',
            solfegeBase: 'Đô',
            pitchClass: 0,
            octave: 0,
            midiNumber: 0,
            exactMidi: 0,
            centsDeviation: 0,
            nearestFreqHz: 0,
        };
    }
    const a4 = options.a4 ?? 440;
    const exactMidi = freqToMidi(freqHz, a4);
    let chosenMidi = Math.round(exactMidi);
    if (options.applyHysteresis && options.lockedMidi && options.lockedMidi > 0) {
        const margin = options.hysteresisMargin ?? 0.54;
        const diff = exactMidi - options.lockedMidi;
        if (Math.abs(diff) <= margin) {
            chosenMidi = options.lockedMidi;
        }
    }
    const pitchClass = ((chosenMidi % 12) + 12) % 12;
    const octave = Math.floor(chosenMidi / 12) - 1;
    const baseNote = exports.NOTE_NAMES[pitchClass];
    const solfegeBase = exports.SOLFEGE_NAMES[pitchClass];
    const centsDeviation = Math.round((exactMidi - chosenMidi) * 100);
    const nearestFreqHz = Math.round(midiToFreq(chosenMidi, a4) * 100) / 100;
    return {
        noteName: `${baseNote}${octave}`,
        solfegeName: `${solfegeBase} ${octave}`,
        baseNote,
        solfegeBase,
        pitchClass,
        octave,
        midiNumber: chosenMidi,
        exactMidi: Math.round(exactMidi * 100) / 100,
        centsDeviation,
        nearestFreqHz,
    };
}
/**
 * Fold user's MIDI value to the nearest octave of the target MIDI
 */
function foldMidiToTargetOctave(userMidi, targetMidi) {
    const octaveShift = Math.round((userMidi - targetMidi) / 12);
    const foldedMidi = userMidi - octaveShift * 12;
    return { foldedMidi, octaveShift };
}
/**
 * Evaluate cents deviation against a target note or frequency, with optional smart octave folding
 */
function evaluateCentsDeviation(userFreqHz, targetMidi, options = {}) {
    const a4 = options.a4 ?? 440;
    const userExactMidi = freqToMidi(userFreqHz, a4);
    if (options.smartOctaveFold) {
        const { foldedMidi, octaveShift } = foldMidiToTargetOctave(userExactMidi, targetMidi);
        const centsDiff = Math.round((foldedMidi - targetMidi) * 100);
        return {
            centsDiff,
            userExactMidi,
            displayMidi: foldedMidi,
            octaveShift,
        };
    }
    const centsDiff = Math.round((userExactMidi - targetMidi) * 100);
    return {
        centsDiff,
        userExactMidi,
        displayMidi: userExactMidi,
        octaveShift: 0,
    };
}
