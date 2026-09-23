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
        return Math.min(22, currentLevel + 1);
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
function generateWordSearchGrid(rows = 12, cols = 20, words = ['NÃO', 'HỌC', 'MẮT'], customAlphabet) {
    const isEnglishWords = words.length > 0 && words.every(w => /^[A-Z0-9\s]+$/i.test(w));
    const defaultAlphabet = isEnglishWords
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        : 'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY';
    const alphabet = customAlphabet || defaultAlphabet;
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    const placedWords = [];
    const sanitizedWords = words.map(w => w.replace(/\s+/g, '').toUpperCase());
    sanitizedWords.forEach((word) => {
        let placed = false;
        const directions = Math.random() < 0.5 ? ['H', 'V'] : ['V', 'H'];
        for (const dir of directions) {
            if (placed)
                break;
            const maxR = dir === 'H' ? rows - 1 : rows - word.length;
            const maxC = dir === 'H' ? cols - word.length : cols - 1;
            if (maxR < 0 || maxC < 0)
                continue;
            for (let attempt = 0; attempt < 100; attempt++) {
                const startR = Math.floor(Math.random() * (maxR + 1));
                const startC = Math.floor(Math.random() * (maxC + 1));
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const checkR = dir === 'H' ? startR : startR + i;
                    const checkC = dir === 'H' ? startC + i : startC;
                    const currentCell = grid[checkR][checkC];
                    if (currentCell !== null && currentCell !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        const placeR = dir === 'H' ? startR : startR + i;
                        const placeC = dir === 'H' ? startC + i : startC;
                        grid[placeR][placeC] = word[i];
                    }
                    placedWords.push({ word, row: startR, col: startC, direction: dir });
                    placed = true;
                    break;
                }
            }
        }
    });
    const finalGrid = grid.map(row => row.map(cell => cell !== null ? cell : alphabet[Math.floor(Math.random() * alphabet.length)]));
    return { grid: finalGrid, placedWords };
}
//# sourceMappingURL=index.js.map