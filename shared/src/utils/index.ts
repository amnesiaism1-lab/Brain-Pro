export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSchulteGrid(size: number = 5, reverse: boolean = false): {
  grid: number[][];
  flatNumbers: number[];
  initialTarget: number;
  maxTarget: number;
} {
  const total = size * size;
  const numbers: number[] = [];
  for (let i = 1; i <= total; i++) {
    numbers.push(i);
  }
  const shuffled = shuffleArray(numbers);
  const grid: number[][] = [];
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

export function generateAnagram(word: string): {
  original: string;
  scrambled: string[];
} {
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

export function calculateWpm(wordCount: number, timeSpentSec: number): number {
  if (timeSpentSec <= 0) return 0;
  return Math.round((wordCount / timeSpentSec) * 60);
}

export function calculateEffectiveWpm(rawWpm: number, comprehensionRatePercent: number): number {
  return Math.round(rawWpm * (Math.max(0, Math.min(100, comprehensionRatePercent)) / 100));
}

export function calculateOptimalRecognitionPoint(word: string): number {
  const len = word.length;
  if (len <= 2) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

export function calculateGameScore(params: {
  level: number;
  accuracyRate: number;
  timeLimitSec: number;
  timeSpentSec: number;
  baseScore?: number;
}): number {
  const base = params.baseScore || 100;
  const accuracyFactor = params.accuracyRate / 100;
  const timeBonus = Math.max(0, (params.timeLimitSec - params.timeSpentSec) * 5 * params.level);
  return Math.round(base * params.level * accuracyFactor + timeBonus);
}

export function calculateRecommendedNextLevel(
  currentLevel: number,
  accuracyRate: number,
  timeSpentSec: number,
  timeLimitSec: number
): number {
  if (accuracyRate >= 90 && timeSpentSec <= timeLimitSec * 0.75) {
    return Math.min(22, currentLevel + 1);
  }
  if (accuracyRate < 60 || timeSpentSec >= timeLimitSec) {
    return Math.max(1, currentLevel - 1);
  }
  return currentLevel;
}

export function generateTwinWords(
  word: string,
  shouldMatch: boolean
): { word1: string; word2: string; isMatch: boolean } {
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

export function generateWordSearchGrid(
  rows: number = 12,
  cols: number = 20,
  words: string[] = ['NÃO', 'HỌC', 'MẮT'],
  customAlphabet?: string
): {
  grid: string[][];
  placedWords: Array<{ word: string; row: number; col: number; direction: 'H' | 'V' }>;
} {
  const isEnglishWords = words.length > 0 && words.every(w => /^[A-Z0-9\s]+$/i.test(w));
  const defaultAlphabet = isEnglishWords
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    : 'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY';
  const alphabet = customAlphabet || defaultAlphabet;

  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  const placedWords: Array<{ word: string; row: number; col: number; direction: 'H' | 'V' }> = [];

  const sanitizedWords = words.map(w => w.replace(/\s+/g, '').toUpperCase());

  sanitizedWords.forEach((word) => {
    let placed = false;
    const directions: Array<'H' | 'V'> = Math.random() < 0.5 ? ['H', 'V'] : ['V', 'H'];

    for (const dir of directions) {
      if (placed) break;
      const maxR = dir === 'H' ? rows - 1 : rows - word.length;
      const maxC = dir === 'H' ? cols - word.length : cols - 1;

      if (maxR < 0 || maxC < 0) continue;

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

  const finalGrid: string[][] = grid.map(row =>
    row.map(cell => cell !== null ? cell : alphabet[Math.floor(Math.random() * alphabet.length)])
  );

  return { grid: finalGrid, placedWords };
}
