import { ExerciseSlug } from '../types';
import { IExerciseModeDefinition } from './types';
import { VOCAL_PITCH_MATCH_MODES } from './modes/vocal-pitch-match';
import { PITCH_RECALL_MODES } from './modes/pitch-recall';
import { INTERVAL_IDENTIFY_MODES } from './modes/interval-identify';
import { CHORD_IDENTIFY_MODES } from './modes/chord-identify';
import { RHYTHM_RECALL_MODES } from './modes/rhythm-recall';
import { SCHULTE_TABLE_MODES } from './modes/schulte-table';
import { createDefaultExerciseMode } from './modes/default';

export const EXERCISE_MODE_REGISTRY: Partial<Record<ExerciseSlug, IExerciseModeDefinition[]>> = {
  'vocal-pitch-match': VOCAL_PITCH_MATCH_MODES,
  'pitch-recall': PITCH_RECALL_MODES,
  'interval-identify': INTERVAL_IDENTIFY_MODES,
  'chord-identify': CHORD_IDENTIFY_MODES,
  'rhythm-recall': RHYTHM_RECALL_MODES,
  'schulte-table': SCHULTE_TABLE_MODES
};

/**
 * Returns all available exercise modes for a slug, falling back to a default mode if none registered.
 */
export function getExerciseModes(slug: ExerciseSlug): IExerciseModeDefinition[] {
  const registered = EXERCISE_MODE_REGISTRY[slug];
  if (registered && registered.length > 0) {
    return registered;
  }
  return [createDefaultExerciseMode(slug)];
}

/**
 * Returns a specific exercise mode by modeId, or the first available mode for that slug.
 */
export function getExerciseMode(slug: ExerciseSlug, modeId?: string): IExerciseModeDefinition {
  const modes = getExerciseModes(slug);
  if (modeId) {
    const found = modes.find(m => m.id === modeId);
    if (found) return found;
  }
  return modes[0];
}
