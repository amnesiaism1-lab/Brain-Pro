"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFINITY_LEVEL_CONFIGS = exports.getInfinityLabel = exports.getInfinityTier = exports.INFINITY_ROMAN_NUMERALS = void 0;
exports.INFINITY_ROMAN_NUMERALS = ['∞-I', '∞-II', '∞-III', '∞-IV', '∞-V', '∞-VI', '∞-VII', '∞-VIII', '∞-IX', '∞-X'];
const getInfinityTier = (level) => {
    if (level >= 13 && level <= 22) {
        return (level - 12);
    }
    return null;
};
exports.getInfinityTier = getInfinityTier;
const getInfinityLabel = (level) => {
    const tier = (0, exports.getInfinityTier)(level);
    if (tier) {
        return exports.INFINITY_ROMAN_NUMERALS[tier - 1];
    }
    return `Cấp ${level}`;
};
exports.getInfinityLabel = getInfinityLabel;
exports.INFINITY_LEVEL_CONFIGS = {
    'anagram': [
        {
            level: 13,
            timeLimitSec: 45,
            targetItemCount: 6,
            variantCode: 'INF_ANAGRAM_EN',
            variantName: '∞-I: Cross-Language Anagram',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Vocabulary with Vietnamese Hints', apiSource: 'dictionary', externalEntityRelation: 'SYNONYM_BRIDGE' },
            parametersJson: { infinityMode: true, langMode: 'en', hintType: 'vi_definition', wordLength: 7 }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 6,
            variantCode: 'INF_ANAGRAM_SYNONYM',
            variantName: '∞-II: Bilingual Race',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', enTheme: 'Synonym Anagram Pairs', apiSource: 'datamuse', externalEntityRelation: 'SYNONYM_BRIDGE' },
            parametersJson: { infinityMode: true, langMode: 'en', entityRelation: 'SYNONYM_BRIDGE', wordLength: 8 }
        },
        {
            level: 15,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_ANAGRAM_VISUAL',
            variantName: '∞-III: Visual Emoji Anagram',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', enTheme: 'Visual Clues & Emoji Decoding' },
            parametersJson: { infinityMode: true, visualLayer: 'emoji', decodingRequired: true, wordLength: 6 }
        },
        {
            level: 16,
            timeLimitSec: 50,
            targetItemCount: 6,
            variantCode: 'INF_ANAGRAM_PHRASE',
            variantName: '∞-IV: Phrase Blast',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'Multi-word Collocation Anagram' },
            parametersJson: { infinityMode: true, phraseLength: 2, crossWordBoundary: true, wordLength: 10 }
        },
        {
            level: 17,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_ANAGRAM_FIBONACCI',
            variantName: '∞-V: Fibonacci Reveal',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, patternMode: 'fibonacci', hintRevealPattern: [1, 1, 2, 3, 5], wordLength: 8 }
        },
        {
            level: 18,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_ANAGRAM_CLUSTER',
            variantName: '∞-VI: Semantic Cluster',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Domain Specific Clusters', apiSource: 'trivia' },
            parametersJson: { infinityMode: true, clusterSize: 5, entityRelation: 'CATEGORY_CLUSTER', wordLength: 9 }
        },
        {
            level: 19,
            timeLimitSec: 40,
            targetItemCount: 8,
            variantCode: 'INF_ANAGRAM_MIRROR',
            variantName: '∞-VII: Mirror Anagram',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'mirror' },
            parametersJson: { infinityMode: true, patternMode: 'mirror', displayTransform: 'reverse', wordLength: 8 }
        },
        {
            level: 20,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_ANAGRAM_DUEL',
            variantName: '∞-VIII: Dueling Streams',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Dual Bilingual Streams' },
            parametersJson: { infinityMode: true, dualStream: true, syncRequired: true, wordLength: 8 }
        },
        {
            level: 21,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_ANAGRAM_RHYTHM',
            variantName: '∞-IX: Rhythm Anagram',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'rhythm' },
            parametersJson: { infinityMode: true, patternMode: 'rhythm', bpmTarget: 120, wordLength: 9 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            targetItemCount: 15,
            variantCode: 'INF_ANAGRAM_ENDLESS',
            variantName: '∞-X: Infinite Cascade',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'cascade' },
            parametersJson: { infinityMode: true, infiniteCascade: true, timeBonus: 3, noTimeLimit: true, wordLength: 10 }
        }
    ],
    'schulte-table': [
        {
            level: 13,
            timeLimitSec: 60,
            gridRows: 7,
            gridCols: 7,
            variantCode: 'INF_SCHULTE_ALPHA_EN',
            variantName: '∞-I: English Alpha-Schulte',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Latin Alphabet A-Z' },
            parametersJson: { infinityMode: true, langMode: 'en', gridContent: 'latin_abc', gridSize: 7 }
        },
        {
            level: 14,
            timeLimitSec: 55,
            gridRows: 7,
            gridCols: 7,
            variantCode: 'INF_SCHULTE_COLOR_CODE',
            variantName: '∞-II: Color-Code Dual Constraint',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, colorRule: 'even_red_odd_blue', dualConstraint: true }
        },
        {
            level: 15,
            timeLimitSec: 50,
            gridRows: 6,
            gridCols: 6,
            variantCode: 'INF_SCHULTE_EMOJI',
            variantName: '∞-III: Emoji Nature Schulte',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, visualLayer: 'emoji', emojiSet: 'nature' }
        },
        {
            level: 16,
            timeLimitSec: 65,
            gridRows: 5,
            gridCols: 5,
            variantCode: 'INF_SCHULTE_DUAL_GRID',
            variantName: '∞-IV: Dual-Grid Synchrony',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, dualGrid: true, alternateGrid: true }
        },
        {
            level: 17,
            timeLimitSec: 45,
            gridRows: 6,
            gridCols: 6,
            variantCode: 'INF_SCHULTE_PHANTOM',
            variantName: '∞-V: Phantom Memory Schulte',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, visibilityMs: 350, phantomMode: true }
        },
        {
            level: 18,
            timeLimitSec: 60,
            gridRows: 6,
            gridCols: 6,
            variantCode: 'INF_SCHULTE_ARITHMETIC',
            variantName: '∞-VI: Arithmetic Schulte',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, cellContent: 'arithmetic', entityRelation: 'COMPUTE_SEQUENCE' }
        },
        {
            level: 19,
            timeLimitSec: 55,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_SCHULTE_ROTATING_COMBO',
            variantName: '∞-VII: Rotating + Fading Vortex',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, rotationCombo: true, rotationAccel: 0.5 }
        },
        {
            level: 20,
            timeLimitSec: 50,
            gridRows: 6,
            gridCols: 6,
            variantCode: 'INF_SCHULTE_VOCAB',
            variantName: '∞-VIII: Lexical Schulte',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', apiSource: 'dictionary' },
            parametersJson: { infinityMode: true, cellContent: 'en_words', hintType: 'vi_meaning' }
        },
        {
            level: 21,
            timeLimitSec: 45,
            gridRows: 7,
            gridCols: 7,
            variantCode: 'INF_SCHULTE_SHADOW',
            variantName: '∞-IX: Shadow Clone Matrix',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, shadowClone: true, distractorGrid: 1 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_SCHULTE_CHAOS',
            variantName: '∞-X: Chaos Dynamic Drift',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, patternMode: 'chaos', shuffleInterval: 5, shufflePercent: 0.3 }
        }
    ],
    'find-letter': [
        {
            level: 13,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_LETTER_BILINGUAL',
            variantName: '∞-I: Bilingual Noise Field',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, langMix: 'vi+en' }
        },
        {
            level: 14,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_LETTER_ROTATED',
            variantName: '∞-II: Rotated Letter Orientations',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, rotationAngles: [0, 90, 180, 270] }
        },
        {
            level: 15,
            timeLimitSec: 30,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_LETTER_CAMOUFLAGE',
            variantName: '∞-III: Color Gradient Camouflage',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, colorMode: 'gradient_camouflage' }
        },
        {
            level: 16,
            timeLimitSec: 35,
            gridRows: 9,
            gridCols: 9,
            variantCode: 'INF_LETTER_FONT_CHAOS',
            variantName: '∞-IV: Multi-Font Typography Chaos',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, fontVariants: 5, fontChaos: true }
        },
        {
            level: 17,
            timeLimitSec: 30,
            gridRows: 9,
            gridCols: 9,
            variantCode: 'INF_LETTER_BLINKING',
            variantName: '∞-V: Blinking Interference Flood',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, blinkRate: 'random', targetBlinkRate: 'fixed' }
        },
        {
            level: 18,
            timeLimitSec: 30,
            gridRows: 10,
            gridCols: 10,
            variantCode: 'INF_LETTER_CASE_CONFLICT',
            variantName: '∞-VI: Dual Case Target Hunt',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, caseInsensitive: true, multiTarget: 2 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            gridRows: 10,
            gridCols: 10,
            variantCode: 'INF_LETTER_SYMBOL_INVASION',
            variantName: '∞-VII: Math & Greek Symbol Noise',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, symbolNoise: 0.4, noiseType: 'mathematical' }
        },
        {
            level: 20,
            timeLimitSec: 40,
            gridRows: 10,
            gridCols: 10,
            variantCode: 'INF_LETTER_GROWING',
            variantName: '∞-VIII: Expanding Grid Expansion',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, growingGrid: true, growInterval: 10 }
        },
        {
            level: 21,
            timeLimitSec: 35,
            gridRows: 11,
            gridCols: 11,
            variantCode: 'INF_LETTER_MIRROR_MAZE',
            variantName: '∞-IX: Split Mirror Vertical Maze',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'mirror' },
            parametersJson: { infinityMode: true, mirrorAxis: 'vertical', splitGrid: true }
        },
        {
            level: 22,
            timeLimitSec: 60,
            gridRows: 12,
            gridCols: 12,
            variantCode: 'INF_LETTER_INFINITE_MATRIX',
            variantName: '∞-X: Infinite Matrix Stream',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, infiniteScroll: true, targetChangeInterval: 15 }
        }
    ],
    'find-number': [
        {
            level: 13,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_NUM_ROMAN',
            variantName: '∞-I: Roman Numeral Conversion',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, displayMode: 'roman', matchType: 'arabic' }
        },
        {
            level: 14,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_NUM_PRIME',
            variantName: '∞-II: Prime Number Constellation',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, targetRule: 'prime', multiTarget: true }
        },
        {
            level: 15,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_NUM_FIBONACCI',
            variantName: '∞-III: Fibonacci Sequence Hunt',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, targetRule: 'fibonacci', patternMode: 'fibonacci' }
        },
        {
            level: 16,
            timeLimitSec: 40,
            gridRows: 7,
            gridCols: 7,
            variantCode: 'INF_NUM_EQUATION',
            variantName: '∞-IV: Equation Grid Match',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, cellContent: 'equation', entityRelation: 'COMPUTE_MATCH' }
        },
        {
            level: 17,
            timeLimitSec: 40,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_NUM_TRIVIA',
            variantName: '∞-V: Numerical Trivia Clues',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', apiSource: 'trivia' },
            parametersJson: { infinityMode: true, apiSource: 'trivia', entityRelation: 'CONTEXT_MEANING' }
        },
        {
            level: 18,
            timeLimitSec: 35,
            gridRows: 8,
            gridCols: 8,
            variantCode: 'INF_NUM_BINARY',
            variantName: '∞-VI: Binary & Hexadecimal Decode',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, cellContent: 'binary', targetFormat: 'decimal' }
        },
        {
            level: 19,
            timeLimitSec: 35,
            gridRows: 9,
            gridCols: 9,
            variantCode: 'INF_NUM_DUAL_COLOR',
            variantName: '∞-VII: Dual Target with Avoid Filter',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, dualTarget: true, avoidColor: 'blue' }
        },
        {
            level: 20,
            timeLimitSec: 30,
            gridRows: 9,
            gridCols: 9,
            variantCode: 'INF_NUM_SURGE',
            variantName: '∞-VIII: Dynamic Speed Surge',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, timerMode: 'dynamic', bonusSec: 2, penaltySec: 3 }
        },
        {
            level: 21,
            timeLimitSec: 35,
            gridRows: 10,
            gridCols: 10,
            variantCode: 'INF_NUM_NEGATIVE_SPACE',
            variantName: '∞-IX: Negative Space Deduction',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, invertLogic: true, entityRelation: 'NEGATIVE_SPACE' }
        },
        {
            level: 22,
            timeLimitSec: 45,
            gridRows: 10,
            gridCols: 10,
            variantCode: 'INF_NUM_CHAOS',
            variantName: '∞-X: Dynamic Cell Refresh Chaos',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, cellRefreshInterval: 1.5, targetRefreshInterval: 8 }
        }
    ],
    'even-odd': [
        {
            level: 13,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_EVEN_ODD_TEXT_EN',
            variantName: '∞-I: English Number Names',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Written English Numerals' },
            parametersJson: { infinityMode: true, displayMode: 'text_en', langMode: 'en' }
        },
        {
            level: 14,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_EVEN_ODD_NEGATIVE',
            variantName: '∞-II: Negative Integer Parity',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, includeNegative: true }
        },
        {
            level: 15,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_EVEN_ODD_TRIPLE_RULE',
            variantName: '∞-III: Triple Parity & Divisible by 3',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, ruleCount: 3, rules: ['even', 'odd', 'div3'] }
        },
        {
            level: 16,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_EVEN_ODD_FRACTION',
            variantName: '∞-IV: Fraction Rounding Parity',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, displayMode: 'fraction', entityRelation: 'COMPUTE_ROUND' }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 15,
            variantCode: 'INF_EVEN_ODD_WORD_PROB',
            variantName: '∞-V: Word Problem Parity',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, displayMode: 'word_problem', entityRelation: 'CONTEXT_COMPUTE' }
        },
        {
            level: 18,
            timeLimitSec: 20,
            targetItemCount: 25,
            variantCode: 'INF_EVEN_ODD_SPEED_STORM',
            variantName: '∞-VI: Speed Storm Sprint',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, timerMode: 'dynamic', windowMs: 800 }
        },
        {
            level: 19,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_EVEN_ODD_COLOR_RULE',
            variantName: '∞-VII: Color Inversion Rules',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, ruleByColor: true, colorRules: { red: 'invert', blue: 'div5' } }
        },
        {
            level: 20,
            timeLimitSec: 30,
            targetItemCount: 24,
            variantCode: 'INF_EVEN_ODD_CASCADE_SEQ',
            variantName: '∞-VIII: Flash Cascade Trio',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', pattern: 'cascade' },
            parametersJson: { infinityMode: true, sequenceLength: 3, flashMs: 300 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_EVEN_ODD_AUDIO_TRAP',
            variantName: '∞-IX: Multimodal Audio Dictation',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, audioHint: true, audioTrapProb: 0.3, entityRelation: 'MULTI_MODAL' }
        },
        {
            level: 22,
            timeLimitSec: 45,
            targetItemCount: 35,
            variantCode: 'INF_EVEN_ODD_INFINITE_PARITY',
            variantName: '∞-X: Infinite Stream Parity',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, autoIncrement: true, speedMode: 'exponential' }
        }
    ],
    'digit-span': [
        {
            level: 13,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_SPAN_ALPHA_EN',
            variantName: '∞-I: Latin Alphabet Span',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Letter Sequence' },
            parametersJson: { infinityMode: true, spanType: 'alpha', langMode: 'en', length: 7 }
        },
        {
            level: 14,
            timeLimitSec: 50,
            targetItemCount: 7,
            variantCode: 'INF_SPAN_WORD_VI',
            variantName: '∞-II: Vocabulary Flash Span',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, spanType: 'word', flashMs: 800, length: 6 }
        },
        {
            level: 15,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_SPAN_COLOR_EN',
            variantName: '∞-III: Color Sequence in English',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, spanType: 'color', recallFormat: 'en_name', length: 7 }
        },
        {
            level: 16,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_SPAN_MIXED',
            variantName: '∞-IV: Alphanumeric Mixed Span',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, spanType: 'mixed', pattern: 'num-alpha-alternate', length: 8 }
        },
        {
            level: 17,
            timeLimitSec: 50,
            targetItemCount: 7,
            variantCode: 'INF_SPAN_SPATIAL',
            variantName: '∞-V: Spatial Coordinate Span',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, spanType: 'spatial', crossExerciseLink: 'spatial-memory' }
        },
        {
            level: 18,
            timeLimitSec: 55,
            targetItemCount: 6,
            variantCode: 'INF_SPAN_EQUATION',
            variantName: '∞-VI: Arithmetic Equation Result Span',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, spanType: 'equation_result', entityRelation: 'COMPUTE_SEQUENCE' }
        },
        {
            level: 19,
            timeLimitSec: 50,
            targetItemCount: 10,
            variantCode: 'INF_SPAN_BACKWARD_CASCADE',
            variantName: '∞-VII: Backward Cascade with Penalty',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'cascade' },
            parametersJson: { infinityMode: true, reverseMode: true, penaltyExtend: 1, length: 9 }
        },
        {
            level: 20,
            timeLimitSec: 55,
            targetItemCount: 8,
            variantCode: 'INF_SPAN_DUAL_CHANNEL',
            variantName: '∞-VIII: Dual-Channel Parallel Span',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, dualChannel: true, channelCount: 2 }
        },
        {
            level: 21,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_SPAN_INTERFERENCE',
            variantName: '∞-IX: Distractor Word Interference',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, interferenceDistractors: true, distractorType: 'words' }
        },
        {
            level: 22,
            timeLimitSec: 60,
            targetItemCount: 12,
            variantCode: 'INF_SPAN_FIBONACCI_WEAVE',
            variantName: '∞-X: Fibonacci Temporal Weave',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, patternMode: 'fibonacci', timingPattern: [1000, 1000, 2000, 3000] }
        }
    ],
    'rsvp-speed-reader': [
        {
            level: 13,
            timeLimitSec: 40,
            speedWpm: 500,
            variantCode: 'INF_RSVP_EN',
            variantName: '∞-I: High-Speed English Prose',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Scientific English Literature' },
            parametersJson: { infinityMode: true, langMode: 'en', speedWpm: 500, comprehensionCheck: true }
        },
        {
            level: 14,
            timeLimitSec: 40,
            speedWpm: 550,
            variantCode: 'INF_RSVP_BILINGUAL',
            variantName: '∞-II: Sentence-Level Bilingual Alternation',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, langAlternate: 'vi-en', switchInterval: 'sentence', speedWpm: 550 }
        },
        {
            level: 15,
            timeLimitSec: 45,
            speedWpm: 500,
            variantCode: 'INF_RSVP_MASKED',
            variantName: '∞-III: Cloze Masked RSVP',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, maskProb: 0.3, fillBlankMode: true, speedWpm: 500 }
        },
        {
            level: 16,
            timeLimitSec: 40,
            speedWpm: 750,
            variantCode: 'INF_RSVP_CHUNKED',
            variantName: '∞-IV: Multi-Word Chunked RSVP',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, chunkSize: 3, crossExerciseLink: 'word-chunking', speedWpm: 750 }
        },
        {
            level: 17,
            timeLimitSec: 40,
            speedWpm: 600,
            variantCode: 'INF_RSVP_EMOJI',
            variantName: '∞-V: Emoji Semantic Embeds',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, visualLayer: 'emoji_replace', speedWpm: 600 }
        },
        {
            level: 18,
            timeLimitSec: 45,
            speedWpm: 800,
            variantCode: 'INF_RSVP_SURGE',
            variantName: '∞-VI: Dynamic Acceleration Surge',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, speedMode: 'auto_surge', surgeStep: 50, surgeInterval: 20 }
        },
        {
            level: 19,
            timeLimitSec: 45,
            speedWpm: 650,
            variantCode: 'INF_RSVP_WIKI',
            variantName: '∞-VII: Wikipedia Live Summaries',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', apiSource: 'wikipedia' },
            parametersJson: { infinityMode: true, apiSource: 'wikipedia', langMode: 'en', speedWpm: 650 }
        },
        {
            level: 20,
            timeLimitSec: 40,
            speedWpm: 450,
            variantCode: 'INF_RSVP_POETRY',
            variantName: '∞-VIII: Affective Poetry & Emotion',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', apiSource: 'poetrydb' },
            parametersJson: { infinityMode: true, apiSource: 'poetrydb', emotionClassify: true, speedWpm: 450 }
        },
        {
            level: 21,
            timeLimitSec: 40,
            speedWpm: 400,
            variantCode: 'INF_RSVP_REVERSE',
            variantName: '∞-IX: Reverse Flow Semantic Reconstruction',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'mirror' },
            parametersJson: { infinityMode: true, reverseStream: true, patternMode: 'mirror', speedWpm: 400 }
        },
        {
            level: 22,
            timeLimitSec: 50,
            speedWpm: 700,
            variantCode: 'INF_RSVP_DUAL_STREAM',
            variantName: '∞-X: Dual Parallel Stream Synthesizer',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X' },
            parametersJson: { infinityMode: true, dualStream: true, syncStreams: true, speedWpm: 700 }
        }
    ],
    'word-search': [
        {
            level: 13,
            timeLimitSec: 60,
            gridRows: 10,
            gridCols: 10,
            targetItemCount: 6,
            variantCode: 'INF_WS_EN',
            variantName: '∞-I: English Vocabulary Hunt',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Science & Technology' },
            parametersJson: { infinityMode: true, langMode: 'en', hintType: 'vi_definition' }
        },
        {
            level: 14,
            timeLimitSec: 55,
            gridRows: 10,
            gridCols: 10,
            targetItemCount: 6,
            variantCode: 'INF_WS_DEF_ONLY',
            variantName: '∞-II: Definition-First Deduction',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', apiSource: 'dictionary' },
            parametersJson: { infinityMode: true, apiSource: 'dictionary', hintMode: 'definition_only' }
        },
        {
            level: 15,
            timeLimitSec: 60,
            gridRows: 11,
            gridCols: 11,
            targetItemCount: 7,
            variantCode: 'INF_WS_SYNONYM',
            variantName: '∞-III: Synonym Cluster Search',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', apiSource: 'datamuse' },
            parametersJson: { infinityMode: true, targetType: 'synonyms', multiWord: true }
        },
        {
            level: 16,
            timeLimitSec: 60,
            gridRows: 11,
            gridCols: 11,
            targetItemCount: 7,
            variantCode: 'INF_WS_BILINGUAL',
            variantName: '∞-IV: Cross-Language Hybrid Matrix',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, langMix: 'vi+en' }
        },
        {
            level: 17,
            timeLimitSec: 65,
            gridRows: 12,
            gridCols: 12,
            targetItemCount: 5,
            variantCode: 'INF_WS_PHRASE',
            variantName: '∞-V: Hidden Collocation Phrases',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, targetType: 'phrase', phraseLength: 2 }
        },
        {
            level: 18,
            timeLimitSec: 50,
            gridRows: 10,
            gridCols: 10,
            targetItemCount: 6,
            variantCode: 'INF_WS_ANTI',
            variantName: '∞-VI: Anti-Word Negative Filter',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, invertLogic: true, entityRelation: 'NEGATIVE_SPACE' }
        },
        {
            level: 19,
            timeLimitSec: 50,
            gridRows: 11,
            gridCols: 11,
            targetItemCount: 6,
            variantCode: 'INF_WS_FADING',
            variantName: '∞-VII: Fading Matrix Glyphs',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, fadingGrid: true, fadeStartSec: 30, fadeDuration: 20 }
        },
        {
            level: 20,
            timeLimitSec: 60,
            gridRows: 11,
            gridCols: 11,
            targetItemCount: 7,
            variantCode: 'INF_WS_ROTATING',
            variantName: '∞-VIII: Clockwise Rotating Grid',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, rotatingGrid: true, rotateInterval: 15 }
        },
        {
            level: 21,
            timeLimitSec: 55,
            gridRows: 10,
            gridCols: 10,
            targetItemCount: 6,
            variantCode: 'INF_WS_EMOJI',
            variantName: '∞-IX: Emoji Character Grid',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, visualLayer: 'emoji', targetType: 'emoji_sequence' }
        },
        {
            level: 22,
            timeLimitSec: 70,
            gridRows: 12,
            gridCols: 12,
            targetItemCount: 8,
            variantCode: 'INF_WS_NEWS',
            variantName: '∞-X: Real-Time Headlines Matrix',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', apiSource: 'news' },
            parametersJson: { infinityMode: true, apiSource: 'news', langMode: 'en', dynamicContent: true }
        }
    ],
    'twin-words': [
        {
            level: 13,
            timeLimitSec: 35,
            targetItemCount: 15,
            variantCode: 'INF_TWIN_EN',
            variantName: '∞-I: English Lexical Pairs',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Vocabulary Orthography' },
            parametersJson: { infinityMode: true, langMode: 'en' }
        },
        {
            level: 14,
            timeLimitSec: 35,
            targetItemCount: 15,
            variantCode: 'INF_TWIN_TRANSLATION',
            variantName: '∞-II: Cross-Language Semantic Match',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, comparisonType: 'translation_match', langMix: 'vi+en' }
        },
        {
            level: 15,
            timeLimitSec: 35,
            targetItemCount: 15,
            variantCode: 'INF_TWIN_SCRAMBLE',
            variantName: '∞-III: Scrambled Set Equivalence',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, displayMode: 'scrambled', entityRelation: 'SET_IDENTITY' }
        },
        {
            level: 16,
            timeLimitSec: 40,
            targetItemCount: 12,
            variantCode: 'INF_TWIN_DIFF_COUNT',
            variantName: '∞-IV: Exact Mutation Counting',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, responseType: 'diff_count', options: [0, 1, 2, '3+'] }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_TWIN_TRIO',
            variantName: '∞-V: Odd-One-Out Triad',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, clusterSize: 3, entityRelation: 'ODD_ONE_OUT' }
        },
        {
            level: 18,
            timeLimitSec: 40,
            targetItemCount: 12,
            variantCode: 'INF_TWIN_DEFINITION',
            variantName: '∞-VI: Lexical Definition Verification',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', apiSource: 'dictionary' },
            parametersJson: { infinityMode: true, comparisonType: 'word_definition', apiSource: 'dictionary' }
        },
        {
            level: 19,
            timeLimitSec: 30,
            targetItemCount: 16,
            variantCode: 'INF_TWIN_FADING_RACE',
            variantName: '∞-VII: Ultra-Flash Retinal Retention',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, flashMs: 300, decisionWindowMs: 1500 }
        },
        {
            level: 20,
            timeLimitSec: 35,
            targetItemCount: 14,
            variantCode: 'INF_TWIN_IPA',
            variantName: '∞-VIII: Phonetic IPA Comparison',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', apiSource: 'dictionary' },
            parametersJson: { infinityMode: true, displayMode: 'phonetic', langMode: 'en' }
        },
        {
            level: 21,
            timeLimitSec: 35,
            targetItemCount: 14,
            variantCode: 'INF_TWIN_CATEGORY',
            variantName: '∞-IX: Semantic Category Bridge',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, comparisonType: 'semantic_category' }
        },
        {
            level: 22,
            timeLimitSec: 45,
            targetItemCount: 20,
            variantCode: 'INF_TWIN_STORM',
            variantName: '∞-X: Exponential Speed Decay Storm',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, speedMode: 'exponential_decay', windowDecay: 0.85 }
        }
    ],
    'peripheral-vision': [
        {
            level: 13,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_ALPHA_EN',
            variantName: '∞-I: Peripheral Latin Letters',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, targetType: 'alpha_en', responseType: 'keyboard', spanPx: 260, flashDurationMs: 250 }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_NUM_SUM',
            variantName: '∞-II: Bilateral Number Arithmetic',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, targetType: 'number', responseType: 'sum', spanPx: 280, flashDurationMs: 240 }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_COLOR_SHAPE',
            variantName: '∞-III: Dual Feature Conjunction',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, targetType: 'shape_color', dualAttribute: true, spanPx: 300, flashDurationMs: 220 }
        },
        {
            level: 16,
            timeLimitSec: 45,
            targetItemCount: 16,
            variantCode: 'INF_PV_4QUADRANT',
            variantName: '∞-IV: 4-Quadrant Omni-Field',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, quadrantCount: 4, centerFixed: true, spanPx: 320, flashDurationMs: 220 }
        },
        {
            level: 17,
            timeLimitSec: 45,
            targetItemCount: 14,
            variantCode: 'INF_PV_SEQUENCE',
            variantName: '∞-V: Sequential Peripheral Trajectory',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, sequenceLength: 3, crossExerciseLink: 'spatial-memory', spanPx: 340, flashDurationMs: 200 }
        },
        {
            level: 18,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_MOVING',
            variantName: '∞-VI: Inward Motion Interception',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, targetMovement: 'inward', captureZone: true, spanPx: 360, flashDurationMs: 200 }
        },
        {
            level: 19,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_EMOJI',
            variantName: '∞-VII: Far-Field Emoji Discrimination',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, targetType: 'emoji', visualLayer: 'emoji', spanPx: 380, flashDurationMs: 180 }
        },
        {
            level: 20,
            timeLimitSec: 40,
            targetItemCount: 15,
            variantCode: 'INF_PV_STROOP',
            variantName: '∞-VIII: Peripheral Stroop Inhibition',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, crossExerciseLink: 'stroop-clash', conflictType: 'color_word', spanPx: 400, flashDurationMs: 180 }
        },
        {
            level: 21,
            timeLimitSec: 50,
            targetItemCount: 18,
            variantCode: 'INF_PV_EXPANDING',
            variantName: '∞-IX: Expanding Visual Angle Horizon',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, fieldExpansion: true, expansionRate: 5, expansionInterval: 5, spanPx: 420, flashDurationMs: 160 }
        },
        {
            level: 22,
            timeLimitSec: 55,
            targetItemCount: 20,
            variantCode: 'INF_PV_CHAOS_FIELD',
            variantName: '∞-X: Hexa-Target Chaos Field',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, targetCount: 6, randomPositions: true, filterRule: 'color', spanPx: 450, flashDurationMs: 150 }
        }
    ],
    'green-dot': [
        {
            level: 13,
            timeLimitSec: 60,
            variantCode: 'INF_GD_EN_TEXT',
            variantName: '∞-I: English Corpus Peripheral Reading',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', apiSource: 'wikipedia' },
            parametersJson: { infinityMode: true, langMode: 'en', apiSource: 'wikipedia' }
        },
        {
            level: 14,
            timeLimitSec: 60,
            variantCode: 'INF_GD_MOVING_DOT',
            variantName: '∞-II: Sinusoidal Focus Tracking',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, dotMovement: 'sine_horizontal', amplitude: 50 }
        },
        {
            level: 15,
            timeLimitSec: 60,
            variantCode: 'INF_GD_DUAL_DOT',
            variantName: '∞-III: Bilateral Focus Switching',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, dotCount: 2, switchInterval: 30 }
        },
        {
            level: 16,
            timeLimitSec: 60,
            variantCode: 'INF_GD_TRIVIA',
            variantName: '∞-IV: Fact Verification Peripheral Audit',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', apiSource: 'trivia' },
            parametersJson: { infinityMode: true, apiSource: 'trivia', comprehensionType: 'fact_verify' }
        },
        {
            level: 17,
            timeLimitSec: 60,
            variantCode: 'INF_GD_NOISE_LAYER',
            variantName: '∞-V: Syntactic Glyph Noise Shield',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, noiseLevel: 0.1, noiseType: 'random_chars' }
        },
        {
            level: 18,
            timeLimitSec: 60,
            variantCode: 'INF_GD_SHRINKING',
            variantName: '∞-VI: Asymptotic Anchor Shrink',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, dotShrink: true, shrinkFrom: 20, shrinkTo: 2 }
        },
        {
            level: 19,
            timeLimitSec: 60,
            variantCode: 'INF_GD_IMAGE_BG',
            variantName: '∞-VII: Cosmic Photography Background',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', apiSource: 'unsplash' },
            parametersJson: { infinityMode: true, apiSource: 'unsplash', backgroundImage: true }
        },
        {
            level: 20,
            timeLimitSec: 60,
            variantCode: 'INF_GD_MOUSE_TRACK',
            variantName: '∞-VIII: Gaze Emulation Micro-Tracking',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, mouseTrackFocus: true, penaltyForMouseMove: true }
        },
        {
            level: 21,
            timeLimitSec: 60,
            variantCode: 'INF_GD_INVISIBLE_DOT',
            variantName: '∞-IX: Phantom Mind-Eye Fixation',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, dotInvisible: true, dotInvisibleAfterSec: 10 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            variantCode: 'INF_GD_SPLIT_ATTN',
            variantName: '∞-X: Hemispheric Split Comprehension',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X' },
            parametersJson: { infinityMode: true, splitContent: true, questionBothSides: true }
        }
    ],
    'word-chunking': [
        {
            level: 13,
            timeLimitSec: 50,
            speedWpm: 550,
            variantCode: 'INF_WC_EN',
            variantName: '∞-I: English Phrase Chunking',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, langMode: 'en', speedWpm: 550 }
        },
        {
            level: 14,
            timeLimitSec: 50,
            speedWpm: 550,
            variantCode: 'INF_WC_BILINGUAL',
            variantName: '∞-II: Alternating Bilingual Chunks',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, langAlternate: 'vi-en', speedWpm: 550 }
        },
        {
            level: 15,
            timeLimitSec: 50,
            speedWpm: 600,
            variantCode: 'INF_WC_KEYWORD',
            variantName: '∞-III: Salient Keyword Highlighting',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, keywordHighlight: true, keywordQuiz: true, speedWpm: 600 }
        },
        {
            level: 16,
            timeLimitSec: 50,
            speedWpm: 650,
            variantCode: 'INF_WC_SEMANTIC',
            variantName: '∞-IV: Grammatical Clause Boundaries',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, chunkBoundary: 'semantic', entityRelation: 'PHRASE_BOUNDARY', speedWpm: 650 }
        },
        {
            level: 17,
            timeLimitSec: 50,
            speedWpm: 450,
            variantCode: 'INF_WC_REVERSE',
            variantName: '∞-V: Inverted Order Chunk Stream',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'mirror' },
            parametersJson: { infinityMode: true, reverseChunkOrder: true, patternMode: 'mirror', speedWpm: 450 }
        },
        {
            level: 18,
            timeLimitSec: 50,
            speedWpm: 800,
            variantCode: 'INF_WC_RAMP',
            variantName: '∞-VI: Exponential Velocity Ramp',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, speedMode: 'linear_ramp', rampStep: 50, speedWpm: 800 }
        },
        {
            level: 19,
            timeLimitSec: 55,
            speedWpm: 500,
            variantCode: 'INF_WC_AUDIO_SYNC',
            variantName: '∞-VII: Multimodal Audio Narration Sync',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', apiSource: 'tts' },
            parametersJson: { infinityMode: true, audioSync: true, apiSource: 'tts', speedWpm: 500 }
        },
        {
            level: 20,
            timeLimitSec: 55,
            speedWpm: 500,
            variantCode: 'INF_WC_CODE',
            variantName: '∞-VIII: Code Syntax Block Chunking',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, contentType: 'code', langMode: 'en', speedWpm: 500 }
        },
        {
            level: 21,
            timeLimitSec: 60,
            speedWpm: 600,
            variantCode: 'INF_WC_INTERLEAVED',
            variantName: '∞-IX: Interleaved Quiz Checkpoints',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, interleaveQuiz: true, quizInterval: 5, speedWpm: 600 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            speedWpm: 550,
            variantCode: 'INF_WC_CHAOS',
            variantName: '∞-X: Permuted Chunk Reconstruction',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, chunkShuffled: true, patternMode: 'chaos', reconstructTest: true }
        }
    ],
    'reading-assessment': [
        {
            level: 13,
            timeLimitSec: 90,
            variantCode: 'INF_RA_EN',
            variantName: '∞-I: English Scientific Assessment',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', apiSource: 'wikipedia' },
            parametersJson: { infinityMode: true, langMode: 'en' }
        },
        {
            level: 14,
            timeLimitSec: 90,
            variantCode: 'INF_RA_BILINGUAL',
            variantName: '∞-II: Cross-Language Query Audit',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, bilingualAudit: true }
        },
        {
            level: 15,
            timeLimitSec: 80,
            variantCode: 'INF_RA_SPEED_RACE',
            variantName: '∞-III: High-Velocity Comprehension Sprint',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, sprintMode: true }
        },
        {
            level: 16,
            timeLimitSec: 90,
            variantCode: 'INF_RA_NEWS',
            variantName: '∞-IV: Contemporary Global News',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', apiSource: 'news' },
            parametersJson: { infinityMode: true, apiSource: 'news', langMode: 'en' }
        },
        {
            level: 17,
            timeLimitSec: 85,
            variantCode: 'INF_RA_FACT_FICTION',
            variantName: '∞-V: Critical Fact vs Fallacy Detection',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, fallacyDetection: true }
        },
        {
            level: 18,
            timeLimitSec: 80,
            variantCode: 'INF_RA_INFERENCE',
            variantName: '∞-VI: Deep Cognitive Inference Matrix',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, inferenceMode: true }
        },
        {
            level: 19,
            timeLimitSec: 80,
            variantCode: 'INF_RA_NOISY',
            variantName: '∞-VII: Perturbed Syntax Proofreading',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, errorHunting: true }
        },
        {
            level: 20,
            timeLimitSec: 90,
            variantCode: 'INF_RA_WIKI_DEEP',
            variantName: '∞-VIII: Deep Encyclopedia Digest',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', apiSource: 'wikipedia' },
            parametersJson: { infinityMode: true, apiSource: 'wikipedia' }
        },
        {
            level: 21,
            timeLimitSec: 95,
            variantCode: 'INF_RA_MULTI_TEXT',
            variantName: '∞-IX: Comparative Multi-Passage Synthesis',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, multiPassage: true }
        },
        {
            level: 22,
            timeLimitSec: 75,
            variantCode: 'INF_RA_LIVE_BLITZ',
            variantName: '∞-X: Real-Time Article Blitz',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', apiSource: 'news' },
            parametersJson: { infinityMode: true, blitzMode: true }
        }
    ],
    'reading-pacer': [
        {
            level: 13,
            timeLimitSec: 60,
            speedWpm: 550,
            variantCode: 'INF_RP_EN',
            variantName: '∞-I: English Dynamic Guide Pacer',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, langMode: 'en', speedWpm: 550 }
        },
        {
            level: 14,
            timeLimitSec: 60,
            speedWpm: 600,
            variantCode: 'INF_RP_BILINGUAL',
            variantName: '∞-II: Dual-Language Alternating Pacer',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, langAlternate: 'vi-en', speedWpm: 600 }
        },
        {
            level: 15,
            timeLimitSec: 60,
            speedWpm: 650,
            variantCode: 'INF_RP_VARIABLE_LINE',
            variantName: '∞-III: Adaptive Line Width Pacer',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, variableWidth: true, speedWpm: 650 }
        },
        {
            level: 16,
            timeLimitSec: 60,
            speedWpm: 700,
            variantCode: 'INF_RP_HIGHLIGHT',
            variantName: '∞-IV: Word-Level Strobe Guide',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, strobeHighlight: true, speedWpm: 700 }
        },
        {
            level: 17,
            timeLimitSec: 60,
            speedWpm: 750,
            variantCode: 'INF_RP_ACCELERATING',
            variantName: '∞-V: Non-Linear Acceleration Pacer',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, accelPacer: true, speedWpm: 750 }
        },
        {
            level: 18,
            timeLimitSec: 60,
            speedWpm: 800,
            variantCode: 'INF_RP_SERPENTINE',
            variantName: '∞-VI: Boustrophedon Serpentine Sweep',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, serpentineSweep: true, speedWpm: 800 }
        },
        {
            level: 19,
            timeLimitSec: 60,
            speedWpm: 850,
            variantCode: 'INF_RP_MASKED_WAKE',
            variantName: '∞-VII: Trailing Visual Mask Pacer',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, trailingMask: true, speedWpm: 850 }
        },
        {
            level: 20,
            timeLimitSec: 60,
            speedWpm: 900,
            variantCode: 'INF_RP_EXPANDING_BEAM',
            variantName: '∞-VIII: Expanding Visual Cone Pacer',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, expandingCone: true, speedWpm: 900 }
        },
        {
            level: 21,
            timeLimitSec: 60,
            speedWpm: 950,
            variantCode: 'INF_RP_DUAL_COLUMN',
            variantName: '∞-IX: Dual Column Parallel Sweep',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, dualColumn: true, speedWpm: 950 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            speedWpm: 1100,
            variantCode: 'INF_RP_HYPERSONIC',
            variantName: '∞-X: Hypersonic Sub-Vocal Obliteration',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, hypersonicMode: true, speedWpm: 1100 }
        }
    ],
    'text-scanning': [
        {
            level: 13,
            timeLimitSec: 45,
            targetItemCount: 4,
            variantCode: 'INF_TS_EN',
            variantName: '∞-I: English Academic Text Scanning',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, langMode: 'en' }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 4,
            variantCode: 'INF_TS_CROSS_LANG',
            variantName: '∞-II: Cross-Language Semantic Keyword',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, crossLangPrompt: true }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 5,
            variantCode: 'INF_TS_SYNONYM',
            variantName: '∞-III: Contextual Synonym Locator',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', apiSource: 'datamuse' },
            parametersJson: { infinityMode: true, synonymScan: true }
        },
        {
            level: 16,
            timeLimitSec: 45,
            targetItemCount: 5,
            variantCode: 'INF_TS_FACT_EXTRACT',
            variantName: '∞-IV: Numerical Data & Entity Mining',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, entityMining: true }
        },
        {
            level: 17,
            timeLimitSec: 40,
            targetItemCount: 6,
            variantCode: 'INF_TS_MULTI_KEYWORD',
            variantName: '∞-V: Triple Multi-Keyword Conjunction',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, multiKeyword: 3 }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 5,
            variantCode: 'INF_TS_VANISHING',
            variantName: '∞-VI: Vanishing Text Horizon',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, vanishingTextSec: 25 }
        },
        {
            level: 19,
            timeLimitSec: 40,
            targetItemCount: 5,
            variantCode: 'INF_TS_NEWS_REALTIME',
            variantName: '∞-VII: Global Breaking Wire Audit',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', apiSource: 'news' },
            parametersJson: { infinityMode: true, apiSource: 'news' }
        },
        {
            level: 20,
            timeLimitSec: 40,
            targetItemCount: 6,
            variantCode: 'INF_TS_INVERTED',
            variantName: '∞-VIII: Negative Space Omission Locator',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, missingWordDetect: true }
        },
        {
            level: 21,
            timeLimitSec: 45,
            targetItemCount: 6,
            variantCode: 'INF_TS_WIKI_DISCOVERY',
            variantName: '∞-IX: Encyclopedia Fact-Finding',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', apiSource: 'wikipedia' },
            parametersJson: { infinityMode: true, apiSource: 'wikipedia' }
        },
        {
            level: 22,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_TS_BLITZ',
            variantName: '∞-X: Ultra-Scanning Blitz Cascade',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'cascade' },
            parametersJson: { infinityMode: true, cascadeStream: true }
        }
    ],
    'card-flip': [
        {
            level: 13,
            timeLimitSec: 85,
            targetItemCount: 16,
            variantCode: 'INF_CF_EN_WORDS',
            variantName: '∞-I: English Vocabulary Pairs',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Word Matching' },
            parametersJson: { infinityMode: true, cardContent: 'en_words', langMode: 'en', pairCount: 16 }
        },
        {
            level: 14,
            timeLimitSec: 85,
            targetItemCount: 16,
            variantCode: 'INF_CF_TRANSLATION',
            variantName: '∞-II: VI-EN Translation Pairs',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', apiSource: 'dictionary', externalEntityRelation: 'SYNONYM_BRIDGE' },
            parametersJson: { infinityMode: true, crossLang: true, matchType: 'translation', pairCount: 16 }
        },
        {
            level: 15,
            timeLimitSec: 80,
            targetItemCount: 16,
            variantCode: 'INF_CF_EMOJI_WORD',
            variantName: '∞-III: Emoji-to-English Bridge',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, matchType: 'emoji_word', visualLayer: 'emoji', pairCount: 16 }
        },
        {
            level: 16,
            timeLimitSec: 80,
            targetItemCount: 16,
            variantCode: 'INF_CF_SYNONYM',
            variantName: '∞-IV: Semantic Synonym Pairs',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', apiSource: 'datamuse' },
            parametersJson: { infinityMode: true, matchType: 'synonym', apiSource: 'datamuse', pairCount: 16 }
        },
        {
            level: 17,
            timeLimitSec: 90,
            targetItemCount: 8,
            variantCode: 'INF_CF_PARTS_OF_SPEECH',
            variantName: '∞-V: Triad: Noun + Verb + Adjective',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, matchCount: 3, triadType: 'pos_cluster', pairCount: 8 }
        },
        {
            level: 18,
            timeLimitSec: 85,
            targetItemCount: 16,
            variantCode: 'INF_CF_UNSPLASH',
            variantName: '∞-VI: High-Res Photography Gallery',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', apiSource: 'unsplash' },
            parametersJson: { infinityMode: true, cardContent: 'image', matchType: 'image_word', pairCount: 16 }
        },
        {
            level: 19,
            timeLimitSec: 80,
            targetItemCount: 16,
            variantCode: 'INF_CF_DRIFT',
            variantName: '∞-VII: Matrix Drift & Rotation Trap',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'chaos' },
            parametersJson: { infinityMode: true, matrixDrift: true, driftIntervalSec: 8, pairCount: 16 }
        },
        {
            level: 20,
            timeLimitSec: 75,
            targetItemCount: 16,
            variantCode: 'INF_CF_SPEED_DECAY',
            variantName: '∞-VIII: Rapid Decay Memory Flash',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, revealDecayMs: 2000, pairCount: 16 }
        },
        {
            level: 21,
            timeLimitSec: 85,
            targetItemCount: 16,
            variantCode: 'INF_CF_NASA',
            variantName: '∞-IX: NASA Deep Space Astronomy',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', apiSource: 'nasa' },
            parametersJson: { infinityMode: true, apiSource: 'nasa', contentTheme: 'astronomy', pairCount: 16 }
        },
        {
            level: 22,
            timeLimitSec: 120,
            targetItemCount: 24,
            variantCode: 'INF_CF_INFINITE_DECK',
            variantName: '∞-X: The Endless Infinite Deck',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, infiniteMode: true, newCardsOnMatch: 4, timerMode: 'fixed_3min' }
        }
    ],
    'stroop-clash': [
        {
            level: 13,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_EN',
            variantName: '∞-I: English Stroop Clash',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'English Color Nomenclature' },
            parametersJson: { infinityMode: true, langMode: 'en', wordLang: 'en' }
        },
        {
            level: 14,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_BILINGUAL',
            variantName: '∞-II: Alternating Bilingual Stroop',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, langAlternate: 'vi-en' }
        },
        {
            level: 15,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_AUDIO',
            variantName: '∞-III: Auditory Conflict Stroop',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', apiSource: 'tts' },
            parametersJson: { infinityMode: true, audioConflict: true, selectRule: 'visual' }
        },
        {
            level: 16,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_4WAY',
            variantName: '∞-IV: 4-Way Multi-Dimensional Stroop',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, multiFeature: 4 }
        },
        {
            level: 17,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_MOTION',
            variantName: '∞-V: Kinetic Motion Stroop',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, motionStroop: true }
        },
        {
            level: 18,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_EMOTION',
            variantName: '∞-VI: Affective Emotional Stroop',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, contentType: 'emotion_word', colorConflict: 'emotional' }
        },
        {
            level: 19,
            timeLimitSec: 30,
            targetItemCount: 18,
            variantCode: 'INF_SC_INVERTED_LOGIC',
            variantName: '∞-VII: Dual Negative Exclusion Stroop',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, exclusionLogic: true }
        },
        {
            level: 20,
            timeLimitSec: 25,
            targetItemCount: 22,
            variantCode: 'INF_SC_HYPERSPEED',
            variantName: '∞-VIII: 400ms Reaction Ramp',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, speedMode: 'ramp_down', windowDecrement: 100, windowMin: 400 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 20,
            variantCode: 'INF_SC_DIRECTIONAL',
            variantName: '∞-IX: Spatial Directional Stroop',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, directionalConflict: true }
        },
        {
            level: 22,
            timeLimitSec: 40,
            targetItemCount: 25,
            variantCode: 'INF_SC_CHAOS',
            variantName: '∞-X: The Ultimate Chaos Stroop',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, chaosRule: true, indicatorFade: true, patternMode: 'chaos' }
        }
    ],
    'spatial-memory': [
        {
            level: 13,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_SM_COLOR_CORSI',
            variantName: '∞-I: Color Corsi Sequence',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, colorSequence: true, recallAttributes: ['position', 'color'] }
        },
        {
            level: 14,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_SM_LETTER',
            variantName: '∞-II: Alphanumeric Spatial Grid',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, cellLabel: 'alpha', recallMode: 'position+char' }
        },
        {
            level: 15,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_SM_ASCENDING_NUM',
            variantName: '∞-III: Ascending Magnitude Corsi',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III' },
            parametersJson: { infinityMode: true, cellLabel: 'number', recallOrder: 'ascending' }
        },
        {
            level: 16,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_SM_3D_CUBE',
            variantName: '∞-IV: Isometric 3D Cube Corsi',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, gridMode: '3d_cube', entityRelation: '3D_SPATIAL' }
        },
        {
            level: 17,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_SM_DIAGONAL',
            variantName: '∞-V: Diagonal Directional Trajectory',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, sequencePattern: 'diagonal', patternMode: 'directional' }
        },
        {
            level: 18,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_SM_MIRROR_CORSI',
            variantName: '∞-VI: Dual-Grid Mirror Corsi',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', pattern: 'mirror' },
            parametersJson: { infinityMode: true, mirrorInput: true, crossGridMirror: true }
        },
        {
            level: 19,
            timeLimitSec: 55,
            targetItemCount: 8,
            variantCode: 'INF_SM_DUAL_TRACK',
            variantName: '∞-VII: Dual Synchronous Corsi',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, dualGrid: true, syncPlayback: true }
        },
        {
            level: 20,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_SM_SHAPE',
            variantName: '∞-VIII: Polymorphic Shape Corsi',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, shapeSequence: true, recallAttributes: ['position', 'shape'] }
        },
        {
            level: 21,
            timeLimitSec: 55,
            gridRows: 6,
            gridCols: 6,
            targetItemCount: 9,
            variantCode: 'INF_SM_EXPANDING',
            variantName: '∞-IX: Dynamic Expanding Grid (to 8x8)',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, gridExpansion: true, expandPerRound: 1 }
        },
        {
            level: 22,
            timeLimitSec: 60,
            targetItemCount: 10,
            variantCode: 'INF_SM_INTERFERENCE',
            variantName: '∞-X: Optical Interference Corsi',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, interferenceDistractors: true, distractorType: 'numbers' }
        }
    ],
    'saccade-tracker': [
        {
            level: 13,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_VOWEL',
            variantName: '∞-I: Phonetic Vowel Discrimination',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I' },
            parametersJson: { infinityMode: true, targetContent: 'letter', triggerRule: 'vowel_only' }
        },
        {
            level: 14,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_DUAL_TARGET',
            variantName: '∞-II: Dual-Target Color Filter',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II' },
            parametersJson: { infinityMode: true, targetCount: 2, filterByColor: 'red' }
        },
        {
            level: 15,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_FIBONACCI_JUMP',
            variantName: '∞-III: Fibonacci Step Trajectory',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, movementPattern: 'fibonacci', patternMode: 'fibonacci' }
        },
        {
            level: 16,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_STROOP_SACCADE',
            variantName: '∞-IV: Saccadic Stroop Inhibition',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV' },
            parametersJson: { infinityMode: true, crossExerciseLink: 'stroop-clash', filterRule: 'ink_color' }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_PREDICTIVE',
            variantName: '∞-V: Predictive Velocity Interception',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V' },
            parametersJson: { infinityMode: true, predictiveMode: true, clickAhead: true }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_PHANTOM_CLICK',
            variantName: '∞-VI: Retinal Afterimage Flash',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI' },
            parametersJson: { infinityMode: true, flashMs: 200, phantomClick: true }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 24,
            variantCode: 'INF_ST_MULTIPLYING',
            variantName: '∞-VII: Mitotic Multiplying Targets',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII' },
            parametersJson: { infinityMode: true, targetMultiply: true, maxTargets: 8 }
        },
        {
            level: 20,
            timeLimitSec: 35,
            targetItemCount: 22,
            variantCode: 'INF_ST_COLOR_SHIFT',
            variantName: '∞-VIII: Chromatic Shift Synchrony',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII' },
            parametersJson: { infinityMode: true, colorShift: true, shiftRate: 4, clickWhen: 'yellow' }
        },
        {
            level: 21,
            timeLimitSec: 35,
            targetItemCount: 20,
            variantCode: 'INF_ST_GRAVITY',
            variantName: '∞-IX: Gravitational Parabolic Physics',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX' },
            parametersJson: { infinityMode: true, gravityPhysics: true, trajectoryPredict: true }
        },
        {
            level: 22,
            timeLimitSec: 45,
            targetItemCount: 25,
            variantCode: 'INF_ST_CHAOS_SWARM',
            variantName: '∞-X: Brownian Chaos Swarm',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, targetCount: 10, movementMode: 'brownian', filterBySymbol: 'star' }
        }
    ],
    'pitch-recall': [
        {
            level: 13,
            timeLimitSec: 50,
            targetItemCount: 7,
            variantCode: 'INF_PITCH_CHROMATIC',
            variantName: '∞-I: Chromatic Storm',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Chromatic Scale Random Walk' },
            parametersJson: { infinityMode: true, scaleType: 'chromatic', sequenceLength: 6, keyCount: 12, noteSpeedMs: 380 }
        },
        {
            level: 14,
            timeLimitSec: 45,
            targetItemCount: 7,
            variantCode: 'INF_PITCH_INTERVAL_ECHO',
            variantName: '∞-II: Interval Echo',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', enTheme: 'Large Interval Jumps & Tritones' },
            parametersJson: { infinityMode: true, wideLeaps: true, sequenceLength: 6, noteSpeedMs: 360 }
        },
        {
            level: 15,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_PITCH_SCALE_DETECT',
            variantName: '∞-III: Scale Detective',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', enTheme: 'Exotic Scales (Blues, Dorian, Pentatonic)' },
            parametersJson: { infinityMode: true, exoticScaleMode: true, sequenceLength: 7, noteSpeedMs: 350 }
        },
        {
            level: 16,
            timeLimitSec: 50,
            targetItemCount: 8,
            variantCode: 'INF_PITCH_TRANSPOSE',
            variantName: '∞-IV: Transposition Challenge',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'Real-time Semitone Transposition' },
            parametersJson: { infinityMode: true, transposeOffset: 2, sequenceLength: 6, noteSpeedMs: 400 }
        },
        {
            level: 17,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_PITCH_FIBONACCI',
            variantName: '∞-V: Fibonacci Cadence',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, patternMode: 'fibonacci', tempoDelaysMs: [120, 120, 240, 360, 600, 960], sequenceLength: 6 }
        },
        {
            level: 18,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_PITCH_BINAURAL',
            variantName: '∞-VI: Binaural Pitch Dichotic',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Dichotic Dual-Ear Notes' },
            parametersJson: { infinityMode: true, binauralStereo: true, sequenceLength: 7, noteSpeedMs: 320 }
        },
        {
            level: 19,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_PITCH_TIMBRE_SHIFT',
            variantName: '∞-VII: Timbre Shift Mirage',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'cascade' },
            parametersJson: { infinityMode: true, dynamicTimbre: true, sequenceLength: 7, noteSpeedMs: 300 }
        },
        {
            level: 20,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_PITCH_MICROTONAL',
            variantName: '∞-VIII: Microtonal Ear',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Quarter-Tone Discrimination' },
            parametersJson: { infinityMode: true, microtonalCents: 50, sequenceLength: 7, noteSpeedMs: 300 }
        },
        {
            level: 21,
            timeLimitSec: 35,
            targetItemCount: 10,
            variantCode: 'INF_PITCH_POLYRHYTHM',
            variantName: '∞-IX: Polyrhythmic Recall',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'rhythm' },
            parametersJson: { infinityMode: true, polyrhythmicVoices: 2, sequenceLength: 8, noteSpeedMs: 260 }
        },
        {
            level: 22,
            timeLimitSec: 35,
            targetItemCount: 10,
            variantCode: 'INF_PITCH_ABSOLUTE',
            variantName: '∞-X: Absolute Pitch Vortex',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, flashDurationMs: 120, noVisualHints: true, sequenceLength: 8, noteSpeedMs: 220 }
        }
    ],
    'interval-identify': [
        {
            level: 13,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_INTERVAL_SPEED',
            variantName: '∞-I: Hyper-Speed Intervals',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Rapid Flash Note Intervals' },
            parametersJson: { infinityMode: true, noteSpeedMs: 150, optionsCount: 5, playbackMode: 'mixed' }
        },
        {
            level: 14,
            timeLimitSec: 45,
            targetItemCount: 10,
            variantCode: 'INF_INTERVAL_CHAIN',
            variantName: '∞-II: Interval Chain Cascade',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', pattern: 'cascade' },
            parametersJson: { infinityMode: true, chainLength: 3, optionsCount: 5 }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_INTERVAL_INVERSION',
            variantName: '∞-III: Mirror Inversion',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', pattern: 'mirror' },
            parametersJson: { infinityMode: true, inversionMode: true, optionsCount: 5 }
        },
        {
            level: 16,
            timeLimitSec: 45,
            targetItemCount: 11,
            variantCode: 'INF_INTERVAL_ACOUSTIC',
            variantName: '∞-IV: Realistic Piano Timbre',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'Acoustic Grand Harmonics' },
            parametersJson: { infinityMode: true, acousticSampler: true, optionsCount: 5, playbackMode: 'harmonic' }
        },
        {
            level: 17,
            timeLimitSec: 40,
            targetItemCount: 11,
            variantCode: 'INF_INTERVAL_MICROTONE',
            variantName: '∞-V: Quarter-Tone Dissonance',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', enTheme: 'Quarter-Tone 50 Cents Steps' },
            parametersJson: { infinityMode: true, microtonal: true, optionsCount: 6 }
        },
        {
            level: 18,
            timeLimitSec: 40,
            targetItemCount: 11,
            variantCode: 'INF_INTERVAL_MELODY_EMBED',
            variantName: '∞-VI: Melody Embedded Interval',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Interval Extraction from Melody' },
            parametersJson: { infinityMode: true, melodyLickContext: true, optionsCount: 6 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_INTERVAL_DICHOTIC',
            variantName: '∞-VII: Dichotic Interval',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'pendulum' },
            parametersJson: { infinityMode: true, leftRightSeparation: true, optionsCount: 6 }
        },
        {
            level: 20,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_INTERVAL_ENHARMONIC',
            variantName: '∞-VIII: Enharmonic Paradox',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Augmented 4th vs Diminished 5th' },
            parametersJson: { infinityMode: true, enharmonicTricks: true, optionsCount: 6 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_INTERVAL_OCTAVE_DISPLACE',
            variantName: '∞-IX: Octave Displacement',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', enTheme: 'Displaced Register Jump' },
            parametersJson: { infinityMode: true, registerSpanOctaves: 3, optionsCount: 6 }
        },
        {
            level: 22,
            timeLimitSec: 30,
            targetItemCount: 13,
            variantCode: 'INF_INTERVAL_CHROMATIC_CHAOS',
            variantName: '∞-X: Omni-Register Chaos',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, fullRange4Octaves: true, harmonic: true, optionsCount: 7 }
        }
    ],
    'rhythm-recall': [
        {
            level: 13,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_RHYTHM_SWING',
            variantName: '∞-I: Swing Feel Ratio',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', pattern: 'rhythm' },
            parametersJson: { infinityMode: true, groove: 'swing', swingRatio: 0.66, stepCount: 12, bpm: 120 }
        },
        {
            level: 14,
            timeLimitSec: 45,
            targetItemCount: 8,
            variantCode: 'INF_RHYTHM_ODD_METER',
            variantName: '∞-II: Odd Meter 5/8 & 7/8',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', enTheme: 'Balkan Asymmetric Time Signatures' },
            parametersJson: { infinityMode: true, timeSignature: '7/8', stepCount: 14, bpm: 125 }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_RHYTHM_GHOST_NOTES',
            variantName: '∞-III: Ghost Notes Stealth',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', enTheme: 'Dynamic Velocity & 15% Volume Ghost Beats' },
            parametersJson: { infinityMode: true, ghostNotes: true, stepCount: 14, bpm: 130 }
        },
        {
            level: 16,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_RHYTHM_TEMPO_MORPH',
            variantName: '∞-IV: Accelerando Pulse',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', pattern: 'cascade' },
            parametersJson: { infinityMode: true, accelerando: true, bpmDelta: 25, stepCount: 14 }
        },
        {
            level: 17,
            timeLimitSec: 40,
            targetItemCount: 9,
            variantCode: 'INF_RHYTHM_METRIC_MOD',
            variantName: '∞-V: Metric Modulation',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'pendulum' },
            parametersJson: { infinityMode: true, metricModulation: true, stepCount: 16 }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 10,
            variantCode: 'INF_RHYTHM_POLYMETER',
            variantName: '∞-VI: Polymetric Clash',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: '3 over 4 Metric Layering' },
            parametersJson: { infinityMode: true, polymeter: '3:4', stepCount: 16, bpm: 135 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 10,
            variantCode: 'INF_RHYTHM_EUCLIDEAN',
            variantName: '∞-VII: Euclidean Geometry Rhythm',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, euclideanRhythm: true, pulses: 5, steps: 16 }
        },
        {
            level: 20,
            timeLimitSec: 35,
            targetItemCount: 10,
            variantCode: 'INF_RHYTHM_PERCUSSION_KIT',
            variantName: '∞-VIII: 4-Piece Drum Matrix',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Kick, Snare, Hi-Hat, Tom Sequencing' },
            parametersJson: { infinityMode: true, multiInstrument: true, stepCount: 16, bpm: 135 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 11,
            variantCode: 'INF_RHYTHM_FIBONACCI_TIME',
            variantName: '∞-IX: Fibonacci Time Warp',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'fibonacci' },
            parametersJson: { infinityMode: true, fibonacciSpacing: true, stepCount: 16 }
        },
        {
            level: 22,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_RHYTHM_CHAOS_QUANTUM',
            variantName: '∞-X: Micro-Timing Precision',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'chaos' },
            parametersJson: { infinityMode: true, toleranceMs: 38, stepCount: 16, bpm: 145 }
        }
    ],
    'chord-identify': [
        {
            level: 13,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_CHORD_ARPEGGIO',
            variantName: '∞-I: Arpeggiated Sweep',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', pattern: 'cascade' },
            parametersJson: { infinityMode: true, arpeggioSpeedMs: 65, optionsCount: 4 }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_CHORD_JAZZ_EXTENDED',
            variantName: '∞-II: Modern Jazz 9th/11th/13th',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', apiSource: 'chords_api', enTheme: 'Extended Jazz Voicings' },
            parametersJson: { infinityMode: true, jazzExtended: true, optionsCount: 4 }
        },
        {
            level: 15,
            timeLimitSec: 45,
            targetItemCount: 10,
            variantCode: 'INF_CHORD_PROGRESSION',
            variantName: '∞-III: Cadence Progression',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', pattern: 'rhythm' },
            parametersJson: { infinityMode: true, progressionCount: 3, optionsCount: 4 }
        },
        {
            level: 16,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_CHORD_POLYCHORD',
            variantName: '∞-IV: Polychord Bi-Tonal',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'Dual Simultaneous Chords' },
            parametersJson: { infinityMode: true, polychord: true, optionsCount: 4 }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_CHORD_TIMBRE_HYBRID',
            variantName: '∞-V: Multi-Instrument Chord',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'mirror' },
            parametersJson: { infinityMode: true, multiTimbreChord: true, optionsCount: 5 }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_CHORD_OPEN_VOICING',
            variantName: '∞-VI: Drop-2 & Wide Voicings',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Spread Voicings Across 3 Octaves' },
            parametersJson: { infinityMode: true, wideVoicing: true, optionsCount: 5 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_CHORD_CLUSTER',
            variantName: '∞-VII: Tone Cluster Tension',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'chaos' },
            parametersJson: { infinityMode: true, toneClusters: true, optionsCount: 5 }
        },
        {
            level: 20,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_CHORD_MODAL',
            variantName: '∞-VIII: Modal Harmony',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Dorian, Lydian, Mixolydian Chords' },
            parametersJson: { infinityMode: true, modalChords: true, optionsCount: 5 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_CHORD_SLASH',
            variantName: '∞-IX: Slash Chord Inversions',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', enTheme: 'Altered Bass Voicing (C/E, G/B)' },
            parametersJson: { infinityMode: true, slashChords: true, optionsCount: 5 }
        },
        {
            level: 22,
            timeLimitSec: 28,
            targetItemCount: 13,
            variantCode: 'INF_CHORD_SPECTRAL',
            variantName: '∞-X: Microtonal Chord Spectrum',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, spectralOvertoneChord: true, optionsCount: 6 }
        }
    ],
    'timbre-match': [
        {
            level: 13,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_TIMBRE_HARMONIC_SERIES',
            variantName: '∞-I: Harmonic Series Anomaly',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', enTheme: 'Missing 3rd or 5th Harmonic' },
            parametersJson: { infinityMode: true, missingHarmonics: true, optionsCount: 4 }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_TIMBRE_ADSR_SCULPT',
            variantName: '∞-II: ADSR Envelope Sculpt',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', pattern: 'cascade' },
            parametersJson: { infinityMode: true, adsrDiscrimination: true, optionsCount: 4 }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_TIMBRE_RESONANCE_SWEEP',
            variantName: '∞-III: Resonance Filter Sweep',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', pattern: 'pendulum' },
            parametersJson: { infinityMode: true, qFactorSweep: true, optionsCount: 4 }
        },
        {
            level: 16,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_TIMBRE_MICRO_DETUNE',
            variantName: '∞-IV: Micro-Detune Flange',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'Detune Cents Discrimination' },
            parametersJson: { infinityMode: true, microDetuneCents: 12, optionsCount: 4 }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_TIMBRE_FM_SYNTH',
            variantName: '∞-V: FM vs AM Synthesis',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'mirror' },
            parametersJson: { infinityMode: true, synthesisType: 'fm-vs-am', optionsCount: 4 }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_TIMBRE_CONVOLUTION_SPACE',
            variantName: '∞-VI: Spatial Convolver',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Acoustic Impulse Response Spaces' },
            parametersJson: { infinityMode: true, reverbAcoustics: true, optionsCount: 4 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_TIMBRE_BITCRUSH_LOFI',
            variantName: '∞-VII: Bitcrush Resolution',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'chaos' },
            parametersJson: { infinityMode: true, bitDepthReduction: true, optionsCount: 4 }
        },
        {
            level: 20,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_TIMBRE_STEREO_PHASE',
            variantName: '∞-VIII: Binaural Phase Cancellation',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: '90° and 180° Phase Shifts' },
            parametersJson: { infinityMode: true, phaseShiftDeg: 180, optionsCount: 4 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_TIMBRE_WAVETABLE_MORPH',
            variantName: '∞-IX: Wavetable Morphing',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'cascade' },
            parametersJson: { infinityMode: true, dynamicWaveMorph: true, optionsCount: 5 }
        },
        {
            level: 22,
            timeLimitSec: 28,
            targetItemCount: 13,
            variantCode: 'INF_TIMBRE_POLY_SPECTRAL',
            variantName: '∞-X: Omni-Spectral Deconstruction',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, tripleLayerExtraction: true, optionsCount: 5 }
        }
    ],
    'sound-localization': [
        {
            level: 13,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_LOC_MOVING_PAN',
            variantName: '∞-I: Dynamic Vector Panning',
            infinityTier: 1,
            infinityMetadata: { tier: 1, romanNumeral: '∞-I', pattern: 'pendulum' },
            parametersJson: { infinityMode: true, continuousPanSpeed: 1.2, optionsCount: 4 }
        },
        {
            level: 14,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_LOC_MULTI_SOURCE',
            variantName: '∞-II: Dual Target Triangulation',
            infinityTier: 2,
            infinityMetadata: { tier: 2, romanNumeral: '∞-II', pattern: 'mirror' },
            parametersJson: { infinityMode: true, dualSimultaneousSources: true, optionsCount: 6 }
        },
        {
            level: 15,
            timeLimitSec: 40,
            targetItemCount: 10,
            variantCode: 'INF_LOC_DISTANCE_ATTENUATION',
            variantName: '∞-III: Distance Cue Proximity',
            infinityTier: 3,
            infinityMetadata: { tier: 3, romanNumeral: '∞-III', enTheme: 'Acoustic Air Attenuation (1m vs 15m)' },
            parametersJson: { infinityMode: true, distancePerception: true, optionsCount: 6 }
        },
        {
            level: 16,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_LOC_DOPPLER_HIGHWAY',
            variantName: '∞-IV: Doppler Shift Velocity',
            infinityTier: 4,
            infinityMetadata: { tier: 4, romanNumeral: '∞-IV', enTheme: 'High-speed 100km/h Doppler Swoop' },
            parametersJson: { infinityMode: true, dopplerFlyby: true, optionsCount: 6 }
        },
        {
            level: 17,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_LOC_HRTF_3D_SPHERE',
            variantName: '∞-V: Full 3D Sphere Elevation',
            infinityTier: 5,
            infinityMetadata: { tier: 5, romanNumeral: '∞-V', pattern: 'rhythm' },
            parametersJson: { infinityMode: true, hrtfFullSphere: true, elevationSteps: [-45, 0, 45, 90], optionsCount: 8 }
        },
        {
            level: 18,
            timeLimitSec: 35,
            targetItemCount: 11,
            variantCode: 'INF_LOC_ACOUSTIC_ECHO',
            variantName: '∞-VI: Echo Suppression Haas Effect',
            infinityTier: 6,
            infinityMetadata: { tier: 6, romanNumeral: '∞-VI', enTheme: 'Haas Precedence & Direct vs Reflected' },
            parametersJson: { infinityMode: true, haasPrecedence: true, optionsCount: 6 }
        },
        {
            level: 19,
            timeLimitSec: 35,
            targetItemCount: 12,
            variantCode: 'INF_LOC_ORBITAL_TRAJECTORY',
            variantName: '∞-VII: Orbital Helix 3D',
            infinityTier: 7,
            infinityMetadata: { tier: 7, romanNumeral: '∞-VII', pattern: 'cascade' },
            parametersJson: { infinityMode: true, helicalTrajectory: true, optionsCount: 8 }
        },
        {
            level: 20,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_LOC_COCKTAIL_PARTY',
            variantName: '∞-VIII: Cocktail Party Filter',
            infinityTier: 8,
            infinityMetadata: { tier: 8, romanNumeral: '∞-VIII', enTheme: 'Focus on Target Amid 3 Spatial Distractors' },
            parametersJson: { infinityMode: true, spatialDistractorsCount: 3, optionsCount: 8 }
        },
        {
            level: 21,
            timeLimitSec: 30,
            targetItemCount: 12,
            variantCode: 'INF_LOC_FREQUENCY_SPLIT',
            variantName: '∞-IX: Frequency Split Pan',
            infinityTier: 9,
            infinityMetadata: { tier: 9, romanNumeral: '∞-IX', pattern: 'mirror' },
            parametersJson: { infinityMode: true, dualFrequencyOpposing: true, optionsCount: 8 }
        },
        {
            level: 22,
            timeLimitSec: 28,
            targetItemCount: 13,
            variantCode: 'INF_LOC_CHRONO_SPATIAL',
            variantName: '∞-X: Chrono-Spatial Constellation',
            infinityTier: 10,
            infinityMetadata: { tier: 10, romanNumeral: '∞-X', pattern: 'infinite' },
            parametersJson: { infinityMode: true, spatialSequenceLength: 6, optionsCount: 8 }
        }
    ]
};
//# sourceMappingURL=infinityConfigs.js.map