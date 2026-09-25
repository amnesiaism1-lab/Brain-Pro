import { IRdeBoardState, IRdeEntity, IRdeAction, ICausalNode, ICausalConnection } from './types';
/**
 * Kiểm tra xem đoạn thẳng (x1, y1)-(x2, y2) có cắt chướng ngại vật (x3, y3)-(x4, y4) không
 */
export declare function checkLineIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean;
/**
 * Kiểm tra kết nối có bị tường chắn hay không
 */
export declare function isConnectionBlockedByWall(source: IRdeEntity, target: IRdeEntity, obstacles: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}>): boolean;
/**
 * Thực thi một hành động can thiệp (Action) lên trạng thái bảng
 */
export declare function applyAction(currentState: IRdeBoardState, action: IRdeAction): {
    nextState: IRdeBoardState;
    effectDescriptionVi: string;
};
/**
 * Bước tính toán động học thời gian thực (Simulation Step for dt seconds)
 */
export declare function stepSimulationDynamics(state: IRdeBoardState, dtSec: number): IRdeBoardState;
/**
 * Tính mức độ thuận tai (consonance) của một quãng âm theo khoảng cách bán âm
 */
export declare function calculateHarmonicConsonance(semitones: number): {
    consonance: 'PERFECT_CONSONANCE' | 'IMPERFECT_CONSONANCE' | 'DISSONANCE' | 'NEUTRAL';
    energyBonus: number;
    descriptionVi: string;
};
/**
 * Tính toán bước kích hoạt tiếp theo của mạch Domino Nhân Quả
 */
export declare function evaluateCausalCascadeCircuit(nodes: ICausalNode[], connections: ICausalConnection[]): {
    nextNodes: ICausalNode[];
    hasReachedTarget: boolean;
    targetAchieved: boolean;
};
//# sourceMappingURL=transition-solver.d.ts.map