import { RelationId } from './relations';
import { ExerciseSlug } from '../types';
export interface IRelationEvent {
    t: number;
    exerciseSlug: ExerciseSlug;
    level: number;
    trialId: string;
    relationId: RelationId;
    relationWeight: number;
    entities: {
        target?: string;
        distractor?: string;
        position?: {
            r: number;
            c: number;
        } | string;
        rule?: string;
        [key: string]: unknown;
    };
    stateBefore: string;
    stateAfter: string;
    responseMs?: number;
    correct: boolean;
    extra?: Record<string, unknown>;
}
export interface IRawMetricsJson {
    schemaVersion: 'v1';
    relationEvents: IRelationEvent[];
    clientTimestamp?: string;
    deviceType?: 'desktop' | 'tablet' | 'mobile';
    [key: string]: unknown;
}
export declare const MAX_RELATION_EVENTS_PER_ATTEMPT = 500;
export declare function validateRelationEvent(event: unknown): event is IRelationEvent;
export declare function validateRawMetricsJson(raw: unknown): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=evidence.d.ts.map