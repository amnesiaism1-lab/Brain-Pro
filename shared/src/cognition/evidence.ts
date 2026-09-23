import { RelationId, ALL_RELATION_IDS } from './relations';
import { ExerciseSlug } from '../types';

export interface IRelationEvent {
  t: number;                 // ms since trial start
  exerciseSlug: ExerciseSlug;
  level: number;
  trialId: string;
  relationId: RelationId;
  relationWeight: number;    // 0 to 1
  entities: {
    target?: string;
    distractor?: string;
    position?: { r: number; c: number } | string;
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

export const MAX_RELATION_EVENTS_PER_ATTEMPT = 500;

export function validateRelationEvent(event: unknown): event is IRelationEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;

  if (typeof e.t !== 'number' || e.t < 0) return false;
  if (typeof e.exerciseSlug !== 'string') return false;
  if (typeof e.level !== 'number' || e.level < 1) return false;
  if (typeof e.trialId !== 'string') return false;
  if (!ALL_RELATION_IDS.includes(e.relationId as RelationId)) return false;
  if (typeof e.relationWeight !== 'number' || e.relationWeight < 0 || e.relationWeight > 1) return false;
  if (!e.entities || typeof e.entities !== 'object') return false;
  if (typeof e.stateBefore !== 'string' || typeof e.stateAfter !== 'string') return false;
  if (typeof e.correct !== 'boolean') return false;

  return true;
}

export function validateRawMetricsJson(raw: unknown): { valid: boolean; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'rawMetricsJson must be an object' };
  }

  const r = raw as Record<string, unknown>;
  if (r.schemaVersion !== 'v1') {
    return { valid: false, error: 'rawMetricsJson schemaVersion must be v1' };
  }

  if (!Array.isArray(r.relationEvents)) {
    return { valid: false, error: 'relationEvents must be an array' };
  }

  if (r.relationEvents.length > MAX_RELATION_EVENTS_PER_ATTEMPT) {
    return { 
      valid: false, 
      error: `relationEvents count (${r.relationEvents.length}) exceeds maximum allowable limit (${MAX_RELATION_EVENTS_PER_ATTEMPT})` 
    };
  }

  for (let i = 0; i < r.relationEvents.length; i++) {
    if (!validateRelationEvent(r.relationEvents[i])) {
      return { valid: false, error: `Invalid relation event structure at index ${i}` };
    }
  }

  return { valid: true };
}
