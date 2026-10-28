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
    getActiveCustomPreset 
  } = useAppStore();

  const currentLevel = getExerciseLevel(exerciseSlug) || 1;
  const isCustomMode = activeSessionSource === 'custom';
  const customPreset = isCustomMode ? getActiveCustomPreset(exerciseSlug) : null;

  const sessionConfig = useMemo(() => {
    return resolveSessionConfig<P>(exerciseSlug, currentLevel, customPreset);
  }, [exerciseSlug, currentLevel, customPreset]);

  return {
    sessionConfig,
    isCustom: sessionConfig.source === 'custom',
    currentLevel
  };
}
