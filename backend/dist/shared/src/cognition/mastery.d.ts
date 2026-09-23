import { RelationId } from './relations';
import { IRelationEvent } from './evidence';
import { ExerciseSlug } from '../types';
export interface IRelationshipMastery {
    relationId: RelationId;
    exposureCount: number;
    accuracy: number;
    medianResponseMs: number;
    stability: number;
    localContexts: ExerciseSlug[];
    transferScore: number;
    interferenceScore: number;
    currentTier: 1 | 2 | 3 | 4;
    updatedAt: string;
}
export interface IRelationTransferEdge {
    relationId: RelationId;
    sourceExerciseSlug: ExerciseSlug;
    targetExerciseSlug: ExerciseSlug;
    transferRatio: number;
    sampleCount: number;
    isBridgeActive: boolean;
}
export declare const MIN_CONFIDENT_EXPOSURE = 40;
export declare const EMA_ALPHA = 0.08;
export declare function createInitialMastery(relationId: RelationId): IRelationshipMastery;
export declare function createInitialMasteriesMap(): Record<RelationId, IRelationshipMastery>;
export declare function updateMasteryFromEvents(current: IRelationshipMastery, events: IRelationEvent[]): IRelationshipMastery;
