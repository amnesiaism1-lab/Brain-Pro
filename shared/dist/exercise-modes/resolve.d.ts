import { ExerciseSlug, IExerciseLevelConfig } from '../types';
import { ICustomExercisePreset, IResolvedSessionConfig } from './types';
export declare const LEGACY_VARIANT_TO_MODE: Record<string, string>;
/**
 * Infer the best modeId for a ladder level configuration if not explicitly provided.
 */
export declare function inferModeIdForLadderLevel(slug: ExerciseSlug, levelConfig?: IExerciseLevelConfig): string;
/**
 * Resolves the final unified session configuration for an exercise run,
 * whether started from the standard ladder or a custom user preset.
 */
export declare function resolveSessionConfig<P = Record<string, unknown>>(exerciseSlug: ExerciseSlug, ladderLevel: number, customPreset?: ICustomExercisePreset | null): IResolvedSessionConfig<P>;
//# sourceMappingURL=resolve.d.ts.map