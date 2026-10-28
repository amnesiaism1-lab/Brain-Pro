import { ExerciseSlug } from '../types';
import { IExerciseModeDefinition } from './types';
export declare const EXERCISE_MODE_REGISTRY: Partial<Record<ExerciseSlug, IExerciseModeDefinition[]>>;
export declare function getExerciseModes(slug: ExerciseSlug): IExerciseModeDefinition[];
export declare function getExerciseMode(slug: ExerciseSlug, modeId?: string): IExerciseModeDefinition;
