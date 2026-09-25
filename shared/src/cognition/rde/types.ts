import { RelationId } from '../relations';
import { ExerciseSlug } from '../../types';

export type RdeEntityType = 'NODE' | 'CONCEPT' | 'OBSTACLE' | 'CORE' | 'MODIFIER';
export type RdeFaction = 'PLAYER' | 'NEUTRAL' | 'ADVERSARY';
export type RdeEntityStatus = 'ACTIVE' | 'FROZEN' | 'SHIELDED' | 'OVERLOADED';
export type RdeEntityRole = 'NORMAL' | 'ATTACKER' | 'HEALER' | 'DEFENDER' | 'AMPLIFIER' | 'CORE';

export interface IRdeEntityState {
  value: number;          // HP, dung lượng, hoặc năng lượng hiện tại
  maxValue: number;
  status: RdeEntityStatus;
  role: RdeEntityRole;
  capacity: number;       // Số lượng kết nối (tentacles) tối đa
  activeConnectionsCount: number;
}

export interface IRdeEntity {
  id: string;
  type: RdeEntityType;
  faction: RdeFaction;
  label: string;
  position: { x: number; y: number };
  state: IRdeEntityState;
  metadata?: Record<string, unknown>;
  soundProps?: {
    pitch?: string;
    freq?: number;
    harmonyRole?: 'TONIC' | 'DOMINANT' | 'SUBDOMINANT' | 'MEDIANT' | 'PASSING';
    overtoneIndex?: number;
  };
}

export type RdeRelationType =
  | 'FLOW_CONNECT'      // Nối truyền dòng năng lượng
  | 'ATTACK_DRAIN'      // Hút / gây sát thương lên đích
  | 'HEAL_BUFF'         // Bơm hồi phục đồng minh
  | 'CONTROL_DEPEND'    // Quan hệ phụ thuộc (Core -> Node con)
  | 'INHIBIT_BLOCK'     // Chặn / đóng băng dòng chảy
  | 'TRANSFORM_ALIGN'   // Biến đổi bản chất / chuyển phe
  | 'SOUND_HARMONIZE';  // Hòa âm tương hỗ giữa 2 cao độ

export type CutAffinity = 'SOURCE_BIASED' | 'TARGET_BIASED' | 'BALANCED';

export interface IRdeRelationProperties {
  strength: number;       // Tốc độ truyền dẫn (đơn vị / giây)
  distance: number;       // Khoảng cách hình học hoặc logic
  direction: 'DIRECTED' | 'BIDIRECTIONAL';
  isActive: boolean;
  cuttable: boolean;
  cutAffinity: CutAffinity; // Cắt gần source hay gần target tạo hậu quả khác nhau
  flowSpeed: number;      // Tốc độ hạt năng lượng chạy trên đường nối
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
  cutRatio?: number;      // 0.0 (sát source) đến 1.0 (sát target)
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
  confidence: number;      // 0.2 đến 1.0
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
  predictionError: number;  // 0.0 (chính xác tuyệt đối) đến 1.0 (sai số cực đại)
  reactionTimeMs: number;
  transferScore: number;
  targetRelations: RelationId[];
}

export interface IRdeChallengeLevel {
  level: number;
  titleVi: string;
  mode: 'SURGICAL_CUT' | 'CORE_DOMINANCE' | 'CASCADE_PREDICT' | 'DYNAMIC_WORLD' | 'SOUND_NETWORK';
  entities: IRdeEntity[];
  relations: IRdeRelation[];
  obstacles?: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>;
  predictionPrompt?: IRdePredictionQuery;
  targetRelations: RelationId[];
  timeLimitSec: number;
  requiredScore: number;
}

// -------------------------------------------------------------
// CAUSAL CASCADE DOMAIN (Hiệu ứng Domino Nhân Quả)
// -------------------------------------------------------------
export type CausalNodeType = 'SOURCE' | 'LEVER' | 'GATE_AND' | 'GATE_OR' | 'INVERTER' | 'RESERVOIR' | 'TARGET';

export interface ICausalNode {
  id: string;
  label: string;
  type: CausalNodeType;
  position: { x: number; y: number };
  state: 'OFF' | 'ON' | 'OVERLOAD' | 'DISABLED';
  value: number; // 0..100
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
  allowedInterventions: number; // e.g. 1 can thiệp tối thiểu
  timeLimitSec: number;
  predictionQuestion?: string;
  predictionOptions?: Array<{ id: string; labelVi: string; isCorrect: boolean }>;
}

// -------------------------------------------------------------
// GRAPH MEMORY MATRIX DOMAIN (Trí nhớ Làm việc Mạng Đồ thị)
// -------------------------------------------------------------
export interface IGraphMemoryNode {
  id: string;
  label: string;
  color?: string;
  position: { x: number; y: number };
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
  options: Array<{ id: string; labelVi: string }>;
  correctOptionId: string;
  explanationVi: string;
}

export interface IGraphMemoryLevel {
  level: number;
  titleVi: string;
  nodes: IGraphMemoryNode[];
  edges: IGraphMemoryEdge[];
  memorizeDurationSec: number; // e.g. 3.5s - 5s
  queries: IGraphMemoryQuery[];
}

// -------------------------------------------------------------
// RULE MUTATION CLASH DOMAIN (Xung Đột Quy Tắc Biến Dị)
// -------------------------------------------------------------
export interface IRuleItem {
  attribute: string; // e.g. 'color:red'
  action: string;    // e.g. 'ATTACK' | 'DEFEND'
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
  options: Array<{ id: string; labelVi: string; action: string }>;
}
