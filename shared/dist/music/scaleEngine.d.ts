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
/**
 * Normalize root input (e.g. "C", "C4", "Db", "Eb") to a standard NoteName.
 */
export declare function normalizeRootPitchClass(input: string): NoteName;
/**
 * Builds array of scale notes for a root and scale definition across octaveSpan (1 or 2 octaves).
 * Includes the final octave tonic (e.g. 1 2 3 4 5 6 7 8).
 */
export declare function buildScaleNotes(rootPitchClass: string, scaleId: string, startOctave?: number, octaveSpan?: number): IScaleNote[];
/**
 * Transpose scale notes by octaves if needed so the majority of notes fall comfortably within user's vocal range.
 */
export declare function fitScaleToVocalRange(notes: IScaleNote[], vocalRange?: VocalRangePreference): IScaleNote[];
/**
 * Generates an exercise melody sequence using a chosen pattern from a scale note pool.
 */
export declare function generateScaleRunPattern(scaleNotes: IScaleNote[], pattern: ScalePatternType, options?: {
    noteCount?: number;
    rng?: () => number;
}): IScaleNote[];
/**
 * Select a random scale and root suitable for user vocal range,
 * avoiding the immediate previous combination when possible.
 */
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
//# sourceMappingURL=scaleEngine.d.ts.map