import { RelationId } from './relations';
import { IRelationshipMastery } from './mastery';
import { ExerciseSlug } from '../types';
export interface ICognitiveDdaResult {
    recommendedLevel: number;
    reason: string;
    scaffoldActive: boolean;
    interferenceActive: boolean;
    relationStrengths: {
        primaryRelation: RelationId;
        primaryAccuracy: number;
        primaryTier: number;
        isBottleneck: boolean;
    };
}
export declare function evaluateCognitiveDda(exerciseSlug: ExerciseSlug, currentLevel: number, accuracyRate: number, timeSpentSec: number, timeLimitSec: number, masteries: Record<RelationId, IRelationshipMastery>): ICognitiveDdaResult;
