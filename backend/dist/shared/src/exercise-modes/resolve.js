"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_VARIANT_TO_MODE = void 0;
exports.inferModeIdForLadderLevel = inferModeIdForLadderLevel;
exports.resolveSessionConfig = resolveSessionConfig;
const registry_1 = require("./registry");
const schema_1 = require("./schema");
const constants_1 = require("../constants");
exports.LEGACY_VARIANT_TO_MODE = {
    'VOCAL_PENTATONIC_CALL': 'vocal.scale',
    'VOCAL_DIATONIC_CONTOUR': 'vocal.scale',
    'VOCAL_OCTAVE_SWITCH': 'vocal.single-note',
    'VOCAL_MICROTONE_MASTERY': 'vocal.single-note',
    'REVERSE_PITCH': 'pitch-recall.reverse',
    'MELODIC_CONTOUR': 'pitch-recall.sequence',
    'OCTAVE_LEAP': 'pitch-recall.sequence',
    'CHROMATIC_ODDBALL': 'pitch-recall.sequence',
    'COMPOUND_INTERVAL': 'interval.identify',
    'RAPID_HARMONIC': 'interval.identify',
    'INVERTED_INTERVAL': 'interval.identify',
    'MICRO_INTERVAL_PRO': 'interval.identify',
    'INVERSION_DETECTION': 'chord.quality',
    'EXTENDED_JAZZ': 'chord.quality',
    'PROGRESSION_CADENCE': 'chord.quality',
    'SPECTRAL_POLYPHONY': 'chord.quality',
    'SWING_GROOVE': 'rhythm.tap-back',
    'POLYRHYTHM_PULSE': 'rhythm.tap-back',
    'TEMPO_WARP': 'rhythm.tap-back',
    'CHRONO_MAESTRO': 'rhythm.tap-back',
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
function inferModeIdForLadderLevel(slug, levelConfig) {
    if (levelConfig?.modeId) {
        return levelConfig.modeId;
    }
    if (levelConfig?.variantCode && exports.LEGACY_VARIANT_TO_MODE[levelConfig.variantCode]) {
        return exports.LEGACY_VARIANT_TO_MODE[levelConfig.variantCode];
    }
    if (slug === 'vocal-pitch-match') {
        const params = (levelConfig?.parametersJson || {});
        if (params.sequenceType === 'scale')
            return 'vocal.scale';
        if (params.sequenceType === 'interval')
            return 'vocal.interval';
        if (params.sequenceType === 'arpeggio')
            return 'vocal.arpeggio';
        return 'vocal.single-note';
    }
    if (slug === 'pitch-recall') {
        const params = (levelConfig?.parametersJson || {});
        if (params.reverseRecall)
            return 'pitch-recall.reverse';
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
function resolveSessionConfig(exerciseSlug, ladderLevel, customPreset) {
    const exerciseMeta = constants_1.EXERCISES_METADATA.find(e => e.slug === exerciseSlug);
    if (customPreset) {
        const mode = (0, registry_1.getExerciseMode)(exerciseSlug, customPreset.modeId);
        const { params } = (0, schema_1.validateAndSanitizeParams)(mode.schema, customPreset.params);
        return {
            source: 'custom',
            exerciseSlug,
            level: ladderLevel,
            modeId: mode.id,
            modeLabelVi: mode.labelVi,
            params: params,
            rounds: customPreset.session.rounds || 3,
            timeLimitSec: customPreset.session.timeLimitSec,
            presetId: customPreset.id,
            presetName: customPreset.name
        };
    }
    const levelConfig = exerciseMeta?.levelConfigs.find(c => c.level === ladderLevel) || {
        level: ladderLevel,
        timeLimitSec: 45,
        targetItemCount: 3,
        parametersJson: {}
    };
    const modeId = inferModeIdForLadderLevel(exerciseSlug, levelConfig);
    const mode = (0, registry_1.getExerciseMode)(exerciseSlug, modeId);
    const { params } = (0, schema_1.validateAndSanitizeParams)(mode.schema, levelConfig.parametersJson);
    return {
        source: 'ladder',
        exerciseSlug,
        level: ladderLevel,
        modeId: mode.id,
        modeLabelVi: mode.labelVi,
        params: params,
        rounds: levelConfig.targetItemCount ?? 3,
        timeLimitSec: levelConfig.timeLimitSec ?? 45
    };
}
//# sourceMappingURL=resolve.js.map