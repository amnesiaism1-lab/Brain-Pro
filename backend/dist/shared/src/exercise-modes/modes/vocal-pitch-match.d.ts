import { IExerciseModeDefinition } from '../types';
export interface IVocalScaleParams {
    scaleSelection: 'random' | 'fixed';
    scalePool: string[];
    scaleId: string;
    rootSelection: 'random' | 'fixed';
    rootPool: string[];
    root: string;
    pattern: 'ascending' | 'descending' | 'up-down' | 'thirds' | 'warmup-5' | 'arpeggio-in-scale' | 'random-walk' | 'random-degrees';
    octaveSpan: number;
    noteCount: number;
    promptMode: 'play-then-sing' | 'call-response' | 'sing-along';
    establishKey: boolean;
    tonicDrone: boolean;
    labelStyle: 'solfege' | 'note' | 'degree' | 'hidden';
    centsTolerance: number;
    holdDurationMs: number;
}
export declare const VOCAL_PITCH_MATCH_MODES: IExerciseModeDefinition[];
