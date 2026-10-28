import { ExerciseSlug } from '../types';
import { IExerciseModeDefinition } from './types';
export declare const EXERCISE_MODE_REGISTRY: Partial<Record<ExerciseSlug, IExerciseModeDefinition[]>>;
/**
 * Returns all available exercise modes for a slug, falling back to a default mode if none registered.
 */
export declare function getExerciseModes(slug: ExerciseSlug): IExerciseModeDefinition[];
/**
 * Returns a specific exercise mode by modeId, or the first available mode for that slug.
 */
export declare function getExerciseMode(slug: ExerciseSlug, modeId?: string): IExerciseModeDefinition;
//# sourceMappingURL=registry.d.ts.map