import { IExerciseModeDefinition } from '../types';
export type ISpatialMemoryParams = {
    gridSize: string;
    sequenceLength: number;
    recallOrder: 'forward' | 'reverse';
    flashSpeedMs: number;
    rotateBoard: boolean;
};
export declare const SPATIAL_MEMORY_MODES: IExerciseModeDefinition<ISpatialMemoryParams>[];
