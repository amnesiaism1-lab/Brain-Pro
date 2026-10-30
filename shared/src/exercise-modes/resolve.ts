import { ExerciseSlug, IExerciseLevelConfig } from '../types';
import { ICustomExercisePreset, IResolvedSessionConfig } from './types';
import { getExerciseMode } from './registry';
import { validateAndSanitizeParams } from './schema';
import { EXERCISES_METADATA } from '../constants';

export const LEGACY_VARIANT_TO_MODE: Record<string, string> = {
  // Vocal pitch match
  'VOCAL_PENTATONIC_CALL': 'vocal.scale',
  'VOCAL_DIATONIC_CONTOUR': 'vocal.scale',
  'VOCAL_OCTAVE_SWITCH': 'vocal.single-note',
  'VOCAL_MICROTONE_MASTERY': 'vocal.single-note',

  // Pitch recall
  'REVERSE_PITCH': 'pitch-recall.reverse',
  'MELODIC_CONTOUR': 'pitch-recall.sequence',
  'OCTAVE_LEAP': 'pitch-recall.sequence',
  'CHROMATIC_ODDBALL': 'pitch-recall.sequence',

  // Interval identify
  'COMPOUND_INTERVAL': 'interval.identify',
  'RAPID_HARMONIC': 'interval.identify',
  'INVERTED_INTERVAL': 'interval.identify',
  'MICRO_INTERVAL_PRO': 'interval.identify',

  // Chord identify
  'INVERSION_DETECTION': 'chord.quality',
  'EXTENDED_JAZZ': 'chord.quality',
  'PROGRESSION_CADENCE': 'chord.quality',
  'SPECTRAL_POLYPHONY': 'chord.quality',

  // Rhythm recall
  'SWING_GROOVE': 'rhythm.tap-back',
  'POLYRHYTHM_PULSE': 'rhythm.tap-back',
  'TEMPO_WARP': 'rhythm.tap-back',
  'CHRONO_MAESTRO': 'rhythm.tap-back',

  // Schulte table
  'GORBOV_RED_BLACK': 'schulte.gorbov',
  'ROTATING_SCHULTE': 'schulte.dynamic',
  'FADING_SCHULTE': 'schulte.dynamic',
  'INF_SCHULTE_ALPHA_EN': 'schulte.alphabet',
  'INF_SCHULTE_COLOR_CODE': 'schulte.gorbov',
  'INF_SCHULTE_ROTATING': 'schulte.dynamic',
  'INF_SCHULTE_ROTATING_COMBO': 'schulte.dynamic',
  'INF_SCHULTE_ALPHA_FADING': 'schulte.dynamic',
  'INF_SCHULTE_ROTATING_GORBOV': 'schulte.dynamic',
  'INF_SCHULTE_CHAOS': 'schulte.dynamic'
};

/**
 * Infer the best modeId for a ladder level configuration if not explicitly provided.
 */
export function inferModeIdForLadderLevel(
  slug: ExerciseSlug,
  levelConfig?: IExerciseLevelConfig
): string {
  if (levelConfig?.modeId) {
    return levelConfig.modeId;
  }

  if (levelConfig?.variantCode && LEGACY_VARIANT_TO_MODE[levelConfig.variantCode]) {
    return LEGACY_VARIANT_TO_MODE[levelConfig.variantCode];
  }

  // Slug-specific ladder inferences
  if (slug === 'vocal-pitch-match') {
    const params = (levelConfig?.parametersJson || {}) as { sequenceType?: string };
    if (params.sequenceType === 'scale') return 'vocal.scale';
    if (params.sequenceType === 'interval') return 'vocal.interval';
    if (params.sequenceType === 'arpeggio') return 'vocal.arpeggio';
    return 'vocal.single-note';
  }

  if (slug === 'pitch-recall') {
    const params = (levelConfig?.parametersJson || {}) as { reverseRecall?: boolean };
    if (params.reverseRecall) return 'pitch-recall.reverse';
    return 'pitch-recall.sequence';
  }

  if (slug === 'interval-identify') {
    return 'interval.identify';
  }

  if (slug === 'chord-identify') {
    return 'chord.quality';
  }

  if (slug === 'rhythm-recall') {
    return 'rhythm.tap-back';
  }

  return `${slug}.standard`;
}

/**
 * Resolves the final unified session configuration for an exercise run,
 * whether started from the standard ladder or a custom user preset.
 */
export function resolveSessionConfig<P = Record<string, unknown>>(
  exerciseSlug: ExerciseSlug,
  ladderLevel: number,
  customPreset?: ICustomExercisePreset | null
): IResolvedSessionConfig<P> {
  const exerciseMeta = EXERCISES_METADATA.find(e => e.slug === exerciseSlug);

  if (customPreset) {
    const mode = getExerciseMode(exerciseSlug, customPreset.modeId);
    const { params } = validateAndSanitizeParams(mode.schema, customPreset.params);

    return {
      source: 'custom',
      exerciseSlug,
      level: ladderLevel,
      modeId: mode.id,
      modeLabelVi: mode.labelVi,
      params: params as unknown as P,
      rounds: customPreset.session.rounds || 3,
      timeLimitSec: customPreset.session.timeLimitSec,
      presetId: customPreset.id,
      presetName: customPreset.name
    };
  }

  // Standard ladder resolution
  const levelConfig = exerciseMeta?.levelConfigs.find(c => c.level === ladderLevel) || {
    level: ladderLevel,
    timeLimitSec: 45,
    targetItemCount: 3,
    parametersJson: {}
  };

  const modeId = inferModeIdForLadderLevel(exerciseSlug, levelConfig);
  const mode = getExerciseMode(exerciseSlug, modeId);
  const { params } = validateAndSanitizeParams(mode.schema, levelConfig.parametersJson);

  return {
    source: 'ladder',
    exerciseSlug,
    level: ladderLevel,
    modeId: mode.id,
    modeLabelVi: mode.labelVi,
    params: params as unknown as P,
    rounds: levelConfig.targetItemCount ?? 3,
    timeLimitSec: levelConfig.timeLimitSec ?? 45
  };
}
