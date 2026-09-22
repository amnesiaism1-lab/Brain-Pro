"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleArray = shuffleArray;
exports.generateSchulteGrid = generateSchulteGrid;
exports.generateAnagram = generateAnagram;
exports.calculateWpm = calculateWpm;
exports.calculateEffectiveWpm = calculateEffectiveWpm;
exports.calculateOptimalRecognitionPoint = calculateOptimalRecognitionPoint;
exports.calculateGameScore = calculateGameScore;
exports.calculateRecommendedNextLevel = calculateRecommendedNextLevel;
exports.generateTwinWords = generateTwinWords;
exports.generateWordSearchGrid = generateWordSearchGrid;
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
function generateSchulteGrid(size = 5, reverse = false) {
    const total = size * size;
    const numbers = [];
    for (let i = 1; i <= total; i++) {
        numbers.push(i);
    }
    const shuffled = shuffleArray(numbers);
    const grid = [];
    for (let r = 0; r < size; r++) {
        grid.push(shuffled.slice(r * size, (r + 1) * size));
    }
    return {
        grid,
        flatNumbers: shuffled,
        initialTarget: reverse ? total : 1,
        maxTarget: reverse ? 1 : total
    };
}
function generateAnagram(word) {
    const letters = word.split('');
    let shuffled = shuffleArray(letters);
    // Ensure it's not identical to original if length > 1
    let attempts = 0;
    while (shuffled.join('') === word && attempts < 10) {
        shuffled = shuffleArray(letters);
        attempts++;
    }
    return {
        original: word,
        scrambled: shuffled
    };
}
function calculateWpm(wordCount, timeSpentSec) {
    if (timeSpentSec <= 0)
        return 0;
    return Math.round((wordCount / timeSpentSec) * 60);
}
function calculateEffectiveWpm(rawWpm, comprehensionRatePercent) {
    return Math.round(rawWpm * (Math.max(0, Math.min(100, comprehensionRatePercent)) / 100));
}
function calculateOptimalRecognitionPoint(word) {
    const len = word.length;
    if (len <= 2)
        return 0;
    if (len <= 5)
        return 1;
    if (len <= 9)
        return 2;
    return 3;
}
function calculateGameScore(params) {
    const base = params.baseScore || 100;
    const accuracyFactor = params.accuracyRate / 100;
    const timeBonus = Math.max(0, (params.timeLimitSec - params.timeSpentSec) * 5 * params.level);
    return Math.round(base * params.level * accuracyFactor + timeBonus);
}
function calculateRecommendedNextLevel(currentLevel, accuracyRate, timeSpentSec, timeLimitSec) {
    if (accuracyRate >= 90 && timeSpentSec <= timeLimitSec * 0.75) {
        return Math.min(8, currentLevel + 1);
    }
    if (accuracyRate < 60 || timeSpentSec >= timeLimitSec) {
        return Math.max(1, currentLevel - 1);
    }
    return currentLevel;
}
function generateTwinWords(word, shouldMatch) {
    if (shouldMatch) {
        return { word1: word, word2: word, isMatch: true };
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = word.split('');
    const posToChange = Math.floor(Math.random() * chars.length);
    const originalChar = chars[posToChange];
    let newChar = alphabet[Math.floor(Math.random() * alphabet.length)];
    while (newChar === originalChar) {
        newChar = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    chars[posToChange] = newChar;
    return {
        word1: word,
        word2: chars.join(''),
        isMatch: false
    };
}
function generateWordSearchGrid(rows = 12, cols = 20, words = ['NÃO', 'HỌC', 'MẮT']) {
    const alphabet = 'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY';
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => alphabet[Math.floor(Math.random() * alphabet.length)]));
    const placedWords = [];
    words.forEach((rawWord, idx) => {
        const word = rawWord.replace(/\s+/g, '').toUpperCase();
        const dir = idx % 2 === 0 ? 'H' : 'V';
        if (dir === 'H') {
            const maxCol = Math.max(0, cols - word.length);
            const r = Math.min(rows - 1, idx * 3 + 1);
            const c = Math.floor(Math.random() * (maxCol + 1));
            for (let i = 0; i < word.length; i++) {
                if (r < rows && c + i < cols) {
                    grid[r][c + i] = word[i];
                }
            }
            placedWords.push({ word, row: r, col: c, direction: 'H' });
        }
        else {
            const maxRow = Math.max(0, rows - word.length);
            const r = Math.floor(Math.random() * (maxRow + 1));
            const c = Math.min(cols - 1, idx * 5 + 2);
            for (let i = 0; i < word.length; i++) {
                if (r + i < rows && c < cols) {
                    grid[r + i][c] = word[i];
                }
            }
            placedWords.push({ word, row: r, col: c, direction: 'V' });
        }
    });
    return { grid, placedWords };
}
