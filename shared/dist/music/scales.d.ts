export type ScaleCategory = 'CHURCH_MODES' | 'MINOR_MODES' | 'PENTATONIC_BLUES' | 'SYMMETRIC' | 'VIETNAMESE' | 'WORLD_EXOTIC';
export interface IScaleCore {
    id: string;
    name: string;
    nameVi: string;
    mode: string;
    category: ScaleCategory;
    categoryVi: string;
    feel: string;
    stepFormula: string;
    intervalFormula: string;
    intervals: string[];
    semitones: number[];
    characterNoteVi: string;
    characteristicIntervals: string[];
    brightnessScore?: number;
    famousSongVi?: string;
    genreVi?: string;
    vocalFriendly: boolean;
    difficultyTier: 1 | 2 | 3 | 4;
}
export declare const INTERVAL_TO_SEMITONES: Record<string, number>;
export declare const INTERVAL_TO_DEGREE_NAME: Record<string, string>;
export declare const ALL_SCALE_CORES: IScaleCore[];
export declare const SCALE_CATALOG: Record<string, IScaleCore>;
/**
 * Curated list of scales strongly recommended for singing practice and vocal warmups.
 */
export declare const VOCAL_RECOMMENDED_SCALE_IDS: string[];
//# sourceMappingURL=scales.d.ts.map