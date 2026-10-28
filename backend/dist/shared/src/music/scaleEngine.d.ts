import { NoteName } from './pitch';
import { IScaleCore } from './scales';
import { VocalRangePreference } from '../types';
export type ScalePatternType = 'ascending' | 'descending' | 'up-down' | 'thirds' | 'warmup-5' | 'arpeggio-in-scale' | 'random-walk' | 'random-degrees';
export interface IScaleNote {
    midi: number;
    note: string;
    pitchClass: NoteName;
    octave: number;
    solfege: string;
    degree: string;
    degreeIndex: number;
    isTonic: boolean;
}
export declare const VOCAL_RANGE_BOUNDS: Record<VocalRangePreference, {
    minMidi: number;
    maxMidi: number;
    defaultOctave: number;
}>;
export declare function normalizeRootPitchClass(input: string): NoteName;
export declare function buildScaleNotes(rootPitchClass: string, scaleId: string, startOctave?: number, octaveSpan?: number): IScaleNote[];
export declare function fitScaleToVocalRange(notes: IScaleNote[], vocalRange?: VocalRangePreference): IScaleNote[];
export declare function generateScaleRunPattern(scaleNotes: IScaleNote[], pattern: ScalePatternType, options?: {
    noteCount?: number;
    rng?: () => number;
}): IScaleNote[];
export declare function pickRandomVocalScale(options?: {
    scalePool?: string[];
    rootPool?: NoteName[];
    vocalRange?: VocalRangePreference;
    lastSelected?: {
        scaleId: string;
        root: string;
    };
    rng?: () => number;
}): {
    scale: IScaleCore;
    root: NoteName;
    defaultOctave: number;
};
