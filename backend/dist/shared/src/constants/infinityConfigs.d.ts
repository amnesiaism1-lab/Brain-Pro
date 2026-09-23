import { ExerciseSlug, IExerciseLevelConfig, InfinityTier } from '../types';
export declare const INFINITY_ROMAN_NUMERALS: readonly ["∞-I", "∞-II", "∞-III", "∞-IV", "∞-V", "∞-VI", "∞-VII", "∞-VIII", "∞-IX", "∞-X"];
export declare const getInfinityTier: (level: number) => InfinityTier | null;
export declare const getInfinityLabel: (level: number) => string;
export declare const INFINITY_LEVEL_CONFIGS: Record<ExerciseSlug, IExerciseLevelConfig[]>;
