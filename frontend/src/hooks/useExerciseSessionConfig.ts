import { useMemo } from 'react';
import { 
  ExerciseSlug, 
  resolveSessionConfig, 
  IResolvedSessionConfig 
} from '@brain-exercises/shared';
import { useAppStore } from '../store/useAppStore';

export function useExerciseSessionConfig<P = Record<string, unknown>>(
  exerciseSlug: ExerciseSlug
): {
  sessionConfig: IResolvedSessionConfig<P>;
  isCustom: boolean;
  currentLevel: number;
} {
  const { 
    getExerciseLevel, 
    activeSessionSource, 
    getActiveCustomPreset,
    ladderSessionRounds
  } = useAppStore();

  const currentLevel = getExerciseLevel(exerciseSlug) || 1;
  const isCustomMode = activeSessionSource === 'custom';
  const customPreset = isCustomMode ? getActiveCustomPreset(exerciseSlug) : null;

  const sessionConfig = useMemo(() => {
    const resolved = resolveSessionConfig<P>(exerciseSlug, currentLevel, customPreset);
    if (resolved.source === 'ladder' && ladderSessionRounds > 0) {
      return {
        ...resolved,
        rounds: ladderSessionRounds
      };
    }
    return resolved;
  }, [exerciseSlug, currentLevel, customPreset, ladderSessionRounds]);

  return {
    sessionConfig,
    isCustom: sessionConfig.source === 'custom',
    currentLevel
  };
}
