import { IRdeBoardState, IRdeEntity, IRdeAction, ICausalNode, ICausalConnection } from './types';
export declare function checkLineIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean;
export declare function isConnectionBlockedByWall(source: IRdeEntity, target: IRdeEntity, obstacles: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}>): boolean;
export declare function applyAction(currentState: IRdeBoardState, action: IRdeAction): {
    nextState: IRdeBoardState;
    effectDescriptionVi: string;
};
export declare function stepSimulationDynamics(state: IRdeBoardState, dtSec: number): IRdeBoardState;
export declare function calculateHarmonicConsonance(semitones: number): {
    consonance: 'PERFECT_CONSONANCE' | 'IMPERFECT_CONSONANCE' | 'DISSONANCE' | 'NEUTRAL';
    energyBonus: number;
    descriptionVi: string;
};
export declare function evaluateCausalCascadeCircuit(nodes: ICausalNode[], connections: ICausalConnection[]): {
    nextNodes: ICausalNode[];
    hasReachedTarget: boolean;
    targetAchieved: boolean;
};
