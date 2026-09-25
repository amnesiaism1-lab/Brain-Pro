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
    soundProps?: {
        pitch?: string;
        freq?: number;
        harmonyRole?: 'TONIC' | 'DOMINANT' | 'SUBDOMINANT' | 'MEDIANT' | 'PASSING';
        overtoneIndex?: number;
    };
}
export type RdeRelationType = 'FLOW_CONNECT' | 'ATTACK_DRAIN' | 'HEAL_BUFF' | 'CONTROL_DEPEND' | 'INHIBIT_BLOCK' | 'TRANSFORM_ALIGN' | 'SOUND_HARMONIZE';
export type CutAffinity = 'SOURCE_BIASED' | 'TARGET_BIASED' | 'BALANCED';
export interface IRdeRelationProperties {
    strength: number;
    distance: number;
    direction: 'DIRECTED' | 'BIDIRECTIONAL';
    isActive: boolean;
    cuttable: boolean;
    cutAffinity: CutAffinity;
    flowSpeed: number;
    harmonicConsonance?: 'PERFECT_CONSONANCE' | 'IMPERFECT_CONSONANCE' | 'DISSONANCE' | 'NEUTRAL';
    intervalSemitones?: number;
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
    soundNetworkActive?: boolean;
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
    objectiveVi?: string;
    hintVi?: string;
    mode: 'SURGICAL_CUT' | 'CORE_DOMINANCE' | 'CASCADE_PREDICT' | 'DYNAMIC_WORLD' | 'SOUND_NETWORK';
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
export type CausalNodeType = 'SOURCE' | 'LEVER' | 'GATE_AND' | 'GATE_OR' | 'INVERTER' | 'RESERVOIR' | 'TARGET';
export interface ICausalNode {
    id: string;
    label: string;
    type: CausalNodeType;
    position: {
        x: number;
        y: number;
    };
    state: 'OFF' | 'ON' | 'OVERLOAD' | 'DISABLED';
    value: number;
    threshold?: number;
    ruleVi?: string;
}
export interface ICausalConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    delayMs: number;
    isFlowing: boolean;
    isBroken?: boolean;
}
export interface ICausalChallenge {
    id: string;
    level: number;
    titleVi: string;
    goalDescriptionVi: string;
    nodes: ICausalNode[];
    connections: ICausalConnection[];
    allowedInterventions: number;
    timeLimitSec: number;
    predictionQuestion?: string;
    predictionOptions?: Array<{
        id: string;
        labelVi: string;
        isCorrect: boolean;
    }>;
}
export interface IGraphMemoryNode {
    id: string;
    label: string;
    color?: string;
    position: {
        x: number;
        y: number;
    };
}
export interface IGraphMemoryEdge {
    id: string;
    sourceId: string;
    targetId: string;
    isDirected: boolean;
    weight?: number;
}
export interface IGraphMemoryQuery {
    id: string;
    questionVi: string;
    queryType: 'SHORTEST_PATH' | 'REACHABILITY' | 'BOTTLENECK' | 'LOOP_DETECT' | 'NEIGHBOR_COUNT';
    options: Array<{
        id: string;
        labelVi: string;
    }>;
    correctOptionId: string;
    explanationVi: string;
}
export interface IGraphMemoryLevel {
    level: number;
    titleVi: string;
    nodes: IGraphMemoryNode[];
    edges: IGraphMemoryEdge[];
    memorizeDurationSec: number;
    queries: IGraphMemoryQuery[];
}
export interface IRuleItem {
    attribute: string;
    action: string;
    condition?: string;
}
export interface IRuleMutationTrial {
    id: string;
    round: number;
    stimulus: {
        color: string;
        shape: string;
        soundPitch?: string;
        orientation?: string;
    };
    activeRules: IRuleItem[];
    hasMutated: boolean;
    mutationAlertVi?: string;
    correctAction: string;
    options: Array<{
        id: string;
        labelVi: string;
        action: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map