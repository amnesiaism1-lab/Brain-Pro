import { RelationId } from '../relations';
import { ExerciseSlug } from '../../types';
export type RdeEntityType = 'NODE' | 'CONCEPT' | 'OBSTACLE' | 'CORE' | 'MODIFIER';
export type RdeFaction = 'PLAYER' | 'NEUTRAL' | 'ADVERSARY';
export type RdeEntityStatus = 'ACTIVE' | 'FROZEN' | 'SHIELDED' | 'OVERLOADED';
export type RdeEntityRole = 'NORMAL' | 'ATTACKER' | 'HEALER' | 'DEFENDER' | 'AMPLIFIER' | 'CORE';
export interface IRdeEntityState {
    value: number;
    maxValue: number;
    status: RdeEntityStatus;
    role: RdeEntityRole;
    capacity: number;
    activeConnectionsCount: number;
}
export interface IRdeEntity {
    id: string;
    type: RdeEntityType;
    faction: RdeFaction;
    label: string;
    position: {
        x: number;
        y: number;
    };
    state: IRdeEntityState;
    metadata?: Record<string, unknown>;
}
export type RdeRelationType = 'FLOW_CONNECT' | 'ATTACK_DRAIN' | 'HEAL_BUFF' | 'CONTROL_DEPEND' | 'INHIBIT_BLOCK' | 'TRANSFORM_ALIGN';
export type CutAffinity = 'SOURCE_BIASED' | 'TARGET_BIASED' | 'BALANCED';
export interface IRdeRelationProperties {
    strength: number;
    distance: number;
    direction: 'DIRECTED' | 'BIDIRECTIONAL';
    isActive: boolean;
    cuttable: boolean;
    cutAffinity: CutAffinity;
    flowSpeed: number;
}
export interface IRdeRelation {
    id: string;
    sourceId: string;
    targetId: string;
    type: RdeRelationType;
    properties: IRdeRelationProperties;
}
export type RdeActionType = 'CONNECT' | 'CUT' | 'FREEZE' | 'TRANSFORM' | 'BOOST_CORE';
export interface IRdeActionParameters {
    cutRatio?: number;
    timingMs?: number;
    resourceCommitted?: number;
}
export interface IRdeAction {
    actionType: RdeActionType;
    sourceEntityId?: string;
    targetEntityId?: string;
    relationId?: string;
    parameters: IRdeActionParameters;
}
export interface IRdeBoardState {
    entities: IRdeEntity[];
    relations: IRdeRelation[];
    activeRules: string[];
    obstacles: Array<{
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>;
    stepCount: number;
}
export interface IRdePredictionQuery {
    questionVi: string;
    options: Array<{
        id: string;
        labelVi: string;
        targetEntityId?: string;
        expectedOutcome?: string;
    }>;
    correctOptionId: string;
    targetRelations: RelationId[];
}
export interface IRdePredictionAnswer {
    selectedOptionId: string;
    confidence: number;
    responseMs: number;
    isCorrect: boolean;
}
export interface IRdeTrialEvidence {
    trialId: string;
    exerciseSlug: ExerciseSlug;
    level: number;
    initialState: IRdeBoardState;
    predictionQuery?: IRdePredictionQuery;
    predictionAnswer?: IRdePredictionAnswer;
    actionTaken: IRdeAction;
    finalState: IRdeBoardState;
    predictionError: number;
    reactionTimeMs: number;
    transferScore: number;
    targetRelations: RelationId[];
}
export interface IRdeChallengeLevel {
    level: number;
    titleVi: string;
    mode: 'SURGICAL_CUT' | 'CORE_DOMINANCE' | 'CASCADE_PREDICT' | 'DYNAMIC_WORLD';
    entities: IRdeEntity[];
    relations: IRdeRelation[];
    obstacles?: Array<{
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>;
    predictionPrompt?: IRdePredictionQuery;
    targetRelations: RelationId[];
    timeLimitSec: number;
    requiredScore: number;
}
//# sourceMappingURL=types.d.ts.map