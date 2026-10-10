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
export declare function freqToMidi(freqHz: number, a4?: number): number;
export declare function midiToFreq(midi: number, a4?: number): number;
export declare function centsDiff(freqHz: number, refFreqHz: number): number;
export declare function foldCents(cents: number): number;
export declare function midiToNoteInfo(midi: number, a4?: number): INoteInfo;
export interface IFreqToNoteOptions {
    a4?: number;
    lockedMidi?: number;
    applyHysteresis?: boolean;
    hysteresisMargin?: number;
}
export declare function freqToNote(freqHz: number, options?: IFreqToNoteOptions): INoteInfo;
export declare function foldMidiToTargetOctave(userMidi: number, targetMidi: number): {
    foldedMidi: number;
    octaveShift: number;
};
export declare function evaluateCentsDeviation(userFreqHz: number, targetMidi: number, options?: {
    smartOctaveFold?: boolean;
    a4?: number;
}): {
    centsDiff: number;
    userExactMidi: number;
    displayMidi: number;
    octaveShift: number;
};
