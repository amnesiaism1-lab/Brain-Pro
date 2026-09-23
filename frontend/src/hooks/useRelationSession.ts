import { useRef, useCallback } from 'react';
import { 
  IRelationEvent, 
  IRawMetricsJson, 
  RelationId, 
  ExerciseSlug,
  MAX_RELATION_EVENTS_PER_ATTEMPT 
} from '@brain-exercises/shared';

interface EmitTrialParams {
  exerciseSlug: ExerciseSlug;
  level: number;
  relationId: RelationId;
  relationWeight?: number;
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

export function useRelationSession() {
  const eventsRef = useRef<IRelationEvent[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialIndexRef = useRef<number>(0);

  const resetSession = useCallback(() => {
    eventsRef.current = [];
    sessionStartTimeRef.current = Date.now();
    trialIndexRef.current = 0;
  }, []);

  const emitTrialEvent = useCallback((params: EmitTrialParams) => {
    if (eventsRef.current.length >= MAX_RELATION_EVENTS_PER_ATTEMPT) {
      return; // cap at 500
    }

    trialIndexRef.current += 1;
    const now = Date.now();
    const event: IRelationEvent = {
      t: now - sessionStartTimeRef.current,
      exerciseSlug: params.exerciseSlug,
      level: params.level,
      trialId: `trial-${trialIndexRef.current}`,
      relationId: params.relationId,
      relationWeight: params.relationWeight ?? 1.0,
      entities: params.entities,
      stateBefore: params.stateBefore,
      stateAfter: params.stateAfter,
      responseMs: params.responseMs,
      correct: params.correct,
      extra: params.extra
    };

    eventsRef.current.push(event);
  }, []);

  const getRawMetricsJson = useCallback((): IRawMetricsJson => {
    return {
      schemaVersion: 'v1',
      relationEvents: [...eventsRef.current],
      clientTimestamp: new Date().toISOString(),
      deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
    };
  }, []);

  const getSessionEvents = useCallback((): IRelationEvent[] => {
    return [...eventsRef.current];
  }, []);

  return {
    resetSession,
    emitTrialEvent,
    getRawMetricsJson,
    getSessionEvents
  };
}
