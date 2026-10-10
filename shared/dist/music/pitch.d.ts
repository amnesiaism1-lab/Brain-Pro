/**
 * Unified Music Pitch & Frequency Utility Functions
 * Single source of truth for frequency, MIDI, cents deviation, and octave folding.
 */
export declare const NOTE_NAMES: readonly ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export type NoteName = typeof NOTE_NAMES[number];
export declare const SOLFEGE_NAMES: readonly ["Đô", "Đô#", "Rê", "Rê#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
export type SolfegeName = typeof SOLFEGE_NAMES[number];
export interface INoteInfo {
    noteName: string;
    solfegeName: string;
    baseNote: NoteName;
    solfegeBase: SolfegeName;
    pitchClass: number;
    octave: number;
    midiNumber: number;
    exactMidi: number;
    centsDeviation: number;
    nearestFreqHz: number;
}
/**
 * Convert frequency in Hz to floating-point MIDI number
 */
export declare function freqToMidi(freqHz: number, a4?: number): number;
/**
 * Convert MIDI number to frequency in Hz
 */
export declare function midiToFreq(midi: number, a4?: number): number;
/**
 * Canonical cents difference between two frequencies (f / fRef)
 * Positive = sharp (higher), negative = flat (lower)
 */
export declare function centsDiff(freqHz: number, refFreqHz: number): number;
/**
 * Mathematical octave folding of cents into the canonical range [-600, +600)
 */
export declare function foldCents(cents: number): number;
/**
 * Convert MIDI note number to structured note naming
 */
export declare function midiToNoteInfo(midi: number, a4?: number): INoteInfo;
export interface IFreqToNoteOptions {
    a4?: number;
    lockedMidi?: number;
    applyHysteresis?: boolean;
    hysteresisMargin?: number;
}
/**
 * Convert frequency in Hz to comprehensive note information with optional boundary hysteresis
 */
export declare function freqToNote(freqHz: number, options?: IFreqToNoteOptions): INoteInfo;
/**
 * Fold user's MIDI value to the nearest octave of the target MIDI
 */
export declare function foldMidiToTargetOctave(userMidi: number, targetMidi: number): {
    foldedMidi: number;
    octaveShift: number;
};
/**
 * Evaluate cents deviation against a target note or frequency, with optional smart octave folding
 */
export declare function evaluateCentsDeviation(userFreqHz: number, targetMidi: number, options?: {
    smartOctaveFold?: boolean;
    a4?: number;
}): {
    centsDiff: number;
    userExactMidi: number;
    displayMidi: number;
    octaveShift: number;
};
//# sourceMappingURL=pitch.d.ts.map