import { RelationId } from './relations';
import { ExerciseSlug } from '../types';
export interface ICognitiveWorkoutChain {
    id: string;
    title: string;
    description: string;
    focusRelations: RelationId[];
    targetDurationMinutes: number;
    steps: {
        order: number;
        exerciseSlug: ExerciseSlug;
        durationSec: number;
        relationObjective: string;
    }[];
}
export declare const COGNITIVE_RELATION_CHAINS: ICognitiveWorkoutChain[];
//# sourceMappingURL=workouts-relation.d.ts.map