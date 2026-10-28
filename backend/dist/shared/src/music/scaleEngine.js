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
exports.VOCAL_RANGE_BOUNDS = {
    'bass-baritone': { minMidi: 45, maxMidi: 65, defaultOctave: 3 },
    'tenor-alto': { minMidi: 53, maxMidi: 72, defaultOctave: 4 },
    'soprano': { minMidi: 58, maxMidi: 79, defaultOctave: 4 },
    'auto': { minMidi: 48, maxMidi: 72, defaultOctave: 4 }
};
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
function buildScaleNotes(rootPitchClass, scaleId, startOctave = 4, octaveSpan = 1) {
    const normRoot = normalizeRootPitchClass(rootPitchClass);
    const rootIndex = pitch_1.NOTE_NAMES.indexOf(normRoot);
    const scale = scales_1.SCALE_CATALOG[scaleId] || scales_1.SCALE_CATALOG['major'] || scales_1.ALL_SCALE_CORES[0];
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
function fitScaleToVocalRange(notes, vocalRange = 'auto') {
    if (notes.length === 0)
        return notes;
    const bounds = exports.VOCAL_RANGE_BOUNDS[vocalRange] || exports.VOCAL_RANGE_BOUNDS['auto'];
    const minMidi = Math.min(...notes.map(n => n.midi));
    const maxMidi = Math.max(...notes.map(n => n.midi));
    let octaveShift = 0;
    if (maxMidi > bounds.maxMidi && minMidi - 12 >= bounds.minMidi - 3) {
        octaveShift = -1;
    }
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
function generateScaleRunPattern(scaleNotes, pattern, options = {}) {
    if (scaleNotes.length === 0)
        return [];
    const rng = options.rng || Math.random;
    const numDegrees = scaleNotes.length;
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
            const fiveNotes = scaleNotes.slice(0, Math.min(5, numDegrees));
            const downFive = fiveNotes.slice(0, fiveNotes.length - 1).reverse();
            return [...fiveNotes, ...downFive];
        }
        case 'thirds': {
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
            const triadIndices = [0, 2, 4, numDegrees - 1];
            const validIndices = triadIndices.filter(i => i < numDegrees);
            const up = validIndices.map(i => scaleNotes[i]);
            const down = validIndices.slice(0, validIndices.length - 1).reverse().map(i => scaleNotes[i]);
            return [...up, ...down];
        }
        case 'random-walk': {
            const count = Math.max(3, options.noteCount ?? 6);
            const result = [];
            let currentIdx = 0;
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
            result.push(scaleNotes[0]);
            let lastIdx = 0;
            for (let i = 1; i < count; i++) {
                let pickIdx = Math.floor(rng() * numDegrees);
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
//# sourceMappingURL=scaleEngine.js.map