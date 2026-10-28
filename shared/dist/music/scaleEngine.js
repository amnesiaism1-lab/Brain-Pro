"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOCAL_RANGE_BOUNDS = void 0;
exports.normalizeRootPitchClass = normalizeRootPitchClass;
exports.buildScaleNotes = buildScaleNotes;
exports.fitScaleToVocalRange = fitScaleToVocalRange;
exports.generateScaleRunPattern = generateScaleRunPattern;
exports.pickRandomVocalScale = pickRandomVocalScale;
const pitch_1 = require("./pitch");
const scales_1 = require("./scales");
// Comfortable pitch ranges for vocal categories (in MIDI numbers)
// C3 = 48, G3 = 55, C4 = 60, G4 = 67, C5 = 72, G5 = 79
exports.VOCAL_RANGE_BOUNDS = {
    'bass-baritone': { minMidi: 45, maxMidi: 65, defaultOctave: 3 }, // A2 to F4
    'tenor-alto': { minMidi: 53, maxMidi: 72, defaultOctave: 4 }, // F3 to C5
    'soprano': { minMidi: 58, maxMidi: 79, defaultOctave: 4 }, // A#3 to G5
    'auto': { minMidi: 48, maxMidi: 72, defaultOctave: 4 } // C3 to C5
};
/**
 * Normalize root input (e.g. "C", "C4", "Db", "Eb") to a standard NoteName.
 */
function normalizeRootPitchClass(input) {
    const clean = input.trim().replace(/[0-9]/g, '');
    const enharmonicMap = {
        'Db': 'C#',
        'Eb': 'D#',
        'Gb': 'F#',
        'Ab': 'G#',
        'Bb': 'A#'
    };
    if (enharmonicMap[clean])
        return enharmonicMap[clean];
    const found = pitch_1.NOTE_NAMES.find(n => n.toLowerCase() === clean.toLowerCase());
    return found || 'C';
}
/**
 * Builds array of scale notes for a root and scale definition across octaveSpan (1 or 2 octaves).
 * Includes the final octave tonic (e.g. 1 2 3 4 5 6 7 8).
 */
function buildScaleNotes(rootPitchClass, scaleId, startOctave = 4, octaveSpan = 1) {
    const normRoot = normalizeRootPitchClass(rootPitchClass);
    const rootIndex = pitch_1.NOTE_NAMES.indexOf(normRoot);
    const scale = scales_1.SCALE_CATALOG[scaleId] || scales_1.SCALE_CATALOG['major'] || scales_1.ALL_SCALE_CORES[0];
    // Base MIDI note for root at startOctave
    // MIDI 60 = C4 => rootMidi = 12 * (startOctave + 1) + rootIndex
    const baseRootMidi = 12 * (startOctave + 1) + rootIndex;
    const result = [];
    for (let span = 0; span < octaveSpan; span++) {
        const octaveOffsetMidi = span * 12;
        scale.semitones.forEach((semitone, degIdx) => {
            const midi = baseRootMidi + octaveOffsetMidi + semitone;
            const noteInfo = (0, pitch_1.midiToNoteInfo)(midi);
            const intervalCode = scale.intervals[degIdx] || `${semitone}st`;
            const baseDegree = scales_1.INTERVAL_TO_DEGREE_NAME[intervalCode] || `${degIdx + 1}`;
            const degreeLabel = span > 0 ? `${baseDegree}+8` : baseDegree;
            result.push({
                midi,
                note: noteInfo.noteName,
                pitchClass: noteInfo.baseNote,
                octave: noteInfo.octave,
                solfege: noteInfo.solfegeName,
                degree: degreeLabel,
                degreeIndex: span * scale.semitones.length + degIdx,
                isTonic: semitone === 0
            });
        });
    }
    // Append top octave tonic (degree 8) to complete the scale cycle
    const topTonicMidi = baseRootMidi + octaveSpan * 12;
    const topInfo = (0, pitch_1.midiToNoteInfo)(topTonicMidi);
    result.push({
        midi: topTonicMidi,
        note: topInfo.noteName,
        pitchClass: topInfo.baseNote,
        octave: topInfo.octave,
        solfege: topInfo.solfegeName,
        degree: octaveSpan > 1 ? '15' : '8',
        degreeIndex: result.length,
        isTonic: true
    });
    return result;
}
/**
 * Transpose scale notes by octaves if needed so the majority of notes fall comfortably within user's vocal range.
 */
function fitScaleToVocalRange(notes, vocalRange = 'auto') {
    if (notes.length === 0)
        return notes;
    const bounds = exports.VOCAL_RANGE_BOUNDS[vocalRange] || exports.VOCAL_RANGE_BOUNDS['auto'];
    const minMidi = Math.min(...notes.map(n => n.midi));
    const maxMidi = Math.max(...notes.map(n => n.midi));
    let octaveShift = 0;
    // If too high, shift down
    if (maxMidi > bounds.maxMidi && minMidi - 12 >= bounds.minMidi - 3) {
        octaveShift = -1;
    }
    // If too low, shift up
    if (minMidi < bounds.minMidi && maxMidi + 12 <= bounds.maxMidi + 3) {
        octaveShift = 1;
    }
    if (octaveShift === 0)
        return notes;
    const semitoneShift = octaveShift * 12;
    return notes.map(n => {
        const newMidi = n.midi + semitoneShift;
        const info = (0, pitch_1.midiToNoteInfo)(newMidi);
        return {
            ...n,
            midi: newMidi,
            note: info.noteName,
            pitchClass: info.baseNote,
            octave: info.octave,
            solfege: info.solfegeName
        };
    });
}
/**
 * Generates an exercise melody sequence using a chosen pattern from a scale note pool.
 */
function generateScaleRunPattern(scaleNotes, pattern, options = {}) {
    if (scaleNotes.length === 0)
        return [];
    const rng = options.rng || Math.random;
    const numDegrees = scaleNotes.length;
    // The notes in scaleNotes typically include 1 to 8 (top tonic)
    switch (pattern) {
        case 'ascending':
            return [...scaleNotes];
        case 'descending':
            return [...scaleNotes].reverse();
        case 'up-down': {
            const up = [...scaleNotes];
            const down = scaleNotes.slice(0, numDegrees - 1).reverse();
            return [...up, ...down];
        }
        case 'warmup-5': {
            // 1 - 2 - 3 - 4 - 5 - 4 - 3 - 2 - 1
            const fiveNotes = scaleNotes.slice(0, Math.min(5, numDegrees));
            const downFive = fiveNotes.slice(0, fiveNotes.length - 1).reverse();
            return [...fiveNotes, ...downFive];
        }
        case 'thirds': {
            // 1 - 3 - 2 - 4 - 3 - 5 - 4 - 6 ...
            const result = [];
            const len = scaleNotes.length;
            for (let i = 0; i < len - 2; i++) {
                result.push(scaleNotes[i]);
                result.push(scaleNotes[i + 2]);
            }
            result.push(scaleNotes[len - 1]);
            return result;
        }
        case 'arpeggio-in-scale': {
            // 1 - 3 - 5 - 8 - 5 - 3 - 1 (diatonic triad arpeggio)
            const triadIndices = [0, 2, 4, numDegrees - 1];
            const validIndices = triadIndices.filter(i => i < numDegrees);
            const up = validIndices.map(i => scaleNotes[i]);
            const down = validIndices.slice(0, validIndices.length - 1).reverse().map(i => scaleNotes[i]);
            return [...up, ...down];
        }
        case 'random-walk': {
            const count = Math.max(3, options.noteCount ?? 6);
            const result = [];
            let currentIdx = 0; // start on tonic
            result.push(scaleNotes[currentIdx]);
            for (let i = 1; i < count; i++) {
                const step = rng() > 0.5 ? 1 : -1;
                let nextIdx = currentIdx + step;
                if (nextIdx < 0)
                    nextIdx = 1;
                if (nextIdx >= numDegrees)
                    nextIdx = numDegrees - 2;
                currentIdx = nextIdx;
                result.push(scaleNotes[currentIdx]);
            }
            return result;
        }
        case 'random-degrees': {
            const count = Math.max(3, options.noteCount ?? 6);
            const result = [];
            // Always start on tonic for tonality anchor
            result.push(scaleNotes[0]);
            let lastIdx = 0;
            for (let i = 1; i < count; i++) {
                let pickIdx = Math.floor(rng() * numDegrees);
                // Avoid repeating the exact same note immediately
                if (pickIdx === lastIdx) {
                    pickIdx = (pickIdx + 1) % numDegrees;
                }
                lastIdx = pickIdx;
                result.push(scaleNotes[pickIdx]);
            }
            return result;
        }
        default:
            return [...scaleNotes];
    }
}
/**
 * Select a random scale and root suitable for user vocal range,
 * avoiding the immediate previous combination when possible.
 */
function pickRandomVocalScale(options = {}) {
    const rng = options.rng || Math.random;
    const pool = options.scalePool && options.scalePool.length > 0
        ? options.scalePool
        : scales_1.VOCAL_RECOMMENDED_SCALE_IDS;
    const validPool = pool.filter(id => scales_1.SCALE_CATALOG[id]);
    const safePool = validPool.length > 0 ? validPool : ['major', 'minor'];
    let chosenScaleId = safePool[Math.floor(rng() * safePool.length)];
    if (options.lastSelected && safePool.length > 1 && chosenScaleId === options.lastSelected.scaleId) {
        const alternativePool = safePool.filter(id => id !== options.lastSelected?.scaleId);
        chosenScaleId = alternativePool[Math.floor(rng() * alternativePool.length)];
    }
    const scale = scales_1.SCALE_CATALOG[chosenScaleId] || scales_1.SCALE_CATALOG['major'] || scales_1.ALL_SCALE_CORES[0];
    const roots = options.rootPool && options.rootPool.length > 0
        ? options.rootPool
        : ['C', 'D', 'E', 'F', 'G', 'A'];
    let chosenRoot = roots[Math.floor(rng() * roots.length)];
    if (options.lastSelected && roots.length > 1 && chosenRoot === options.lastSelected.root) {
        const altRoots = roots.filter(r => r !== options.lastSelected?.root);
        chosenRoot = altRoots[Math.floor(rng() * altRoots.length)];
    }
    const range = options.vocalRange || 'auto';
    const defaultOctave = exports.VOCAL_RANGE_BOUNDS[range]?.defaultOctave ?? 4;
    return { scale, root: chosenRoot, defaultOctave };
}
