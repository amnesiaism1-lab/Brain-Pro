export declare function shuffleArray<T>(array: T[]): T[];
export declare function generateSchulteGrid(size?: number, reverse?: boolean): {
    grid: number[][];
    flatNumbers: number[];
    initialTarget: number;
    maxTarget: number;
};
export declare function generateAnagram(word: string): {
    original: string;
    scrambled: string[];
};
export declare function calculateWpm(wordCount: number, timeSpentSec: number): number;
export declare function calculateEffectiveWpm(rawWpm: number, comprehensionRatePercent: number): number;
export declare function calculateOptimalRecognitionPoint(word: string): number;
export declare function calculateGameScore(params: {
    level: number;
    accuracyRate: number;
    timeLimitSec: number;
    timeSpentSec: number;
    baseScore?: number;
}): number;
export declare function calculateRecommendedNextLevel(currentLevel: number, accuracyRate: number, timeSpentSec: number, timeLimitSec: number): number;
export declare function generateTwinWords(word: string, shouldMatch: boolean): {
    word1: string;
    word2: string;
    isMatch: boolean;
};
export declare function generateWordSearchGrid(rows?: number, cols?: number, words?: string[], customAlphabet?: string): {
    grid: string[][];
    placedWords: Array<{
        word: string;
        row: number;
        col: number;
        direction: 'H' | 'V';
    }>;
};
