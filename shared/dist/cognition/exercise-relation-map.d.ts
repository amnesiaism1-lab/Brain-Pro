import { RelationId } from './relations';
import { ExerciseSlug } from '../types';
export interface IExerciseRelationMapping {
    slug: ExerciseSlug;
    primaryRelation: RelationId;
    secondaryRelations: RelationId[];
    levelAffinity: Record<number, RelationId[]>;
}
export declare const EXERCISE_RELATION_MAP: Record<ExerciseSlug, IExerciseRelationMapping>;
export declare function getRelationsForExercise(slug: ExerciseSlug, level: number): RelationId[];
//# sourceMappingURL=exercise-relation-map.d.ts.map