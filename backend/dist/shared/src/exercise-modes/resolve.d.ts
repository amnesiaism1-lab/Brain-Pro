import { ExerciseSlug, IExerciseLevelConfig } from '../types';
import { ICustomExercisePreset, IResolvedSessionConfig } from './types';
export declare const LEGACY_VARIANT_TO_MODE: Record<string, string>;
export declare function inferModeIdForLadderLevel(slug: ExerciseSlug, levelConfig?: IExerciseLevelConfig): string;
export declare function resolveSessionConfig<P = Record<string, unknown>>(exerciseSlug: ExerciseSlug, ladderLevel: number, customPreset?: ICustomExercisePreset | null): IResolvedSessionConfig<P>;
