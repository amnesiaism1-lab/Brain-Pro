"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXERCISE_MODE_REGISTRY = void 0;
exports.getExerciseModes = getExerciseModes;
exports.getExerciseMode = getExerciseMode;
const vocal_pitch_match_1 = require("./modes/vocal-pitch-match");
const pitch_recall_1 = require("./modes/pitch-recall");
const interval_identify_1 = require("./modes/interval-identify");
const chord_identify_1 = require("./modes/chord-identify");
const rhythm_recall_1 = require("./modes/rhythm-recall");
const default_1 = require("./modes/default");
exports.EXERCISE_MODE_REGISTRY = {
    'vocal-pitch-match': vocal_pitch_match_1.VOCAL_PITCH_MATCH_MODES,
    'pitch-recall': pitch_recall_1.PITCH_RECALL_MODES,
    'interval-identify': interval_identify_1.INTERVAL_IDENTIFY_MODES,
    'chord-identify': chord_identify_1.CHORD_IDENTIFY_MODES,
    'rhythm-recall': rhythm_recall_1.RHYTHM_RECALL_MODES
};
function getExerciseModes(slug) {
    const registered = exports.EXERCISE_MODE_REGISTRY[slug];
    if (registered && registered.length > 0) {
        return registered;
    }
    return [(0, default_1.createDefaultExerciseMode)(slug)];
}
function getExerciseMode(slug, modeId) {
    const modes = getExerciseModes(slug);
    if (modeId) {
        const found = modes.find(m => m.id === modeId);
        if (found)
            return found;
    }
    return modes[0];
}
//# sourceMappingURL=registry.js.map