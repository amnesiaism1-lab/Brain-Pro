import { describe, it, expect } from 'vitest';
import {
  computeExpectedSequence,
  formatChunkedSequence,
  analyzeSequenceDiff,
  analyzeSpatialDiff
} from '../memoryDiffAnalysis';

describe('computeExpectedSequence & formatChunkedSequence', () => {
  it('computes forward, reverse, sort-asc, and plus-one (including 9 -> 0 wraparound)', () => {
    expect(computeExpectedSequence('4917', 'forward')).toBe('4917');
    expect(computeExpectedSequence('4917', 'reverse')).toBe('7194');
    expect(computeExpectedSequence('4917', 'sort-asc')).toBe('1479');
    expect(computeExpectedSequence('4919', 'plus-one')).toBe('5020');
    expect(computeExpectedSequence('AZ', 'plus-one')).toBe('BA');
  });

  it('transforms space-separated word tokens correctly', () => {
    expect(computeExpectedSequence('CAT SUN MAP', 'reverse', true)).toBe('MAP SUN CAT');
    expect(computeExpectedSequence('SUN CAT MAP', 'sort-asc', true)).toBe('CAT MAP SUN');
  });

  it('chunks sequences without leaving single-digit orphan tails for lengths >= 5', () => {
    expect(formatChunkedSequence('1234'.split(''))).toBe('1234');
    expect(formatChunkedSequence('123456'.split(''))).toBe('123 · 456');
    expect(formatChunkedSequence('1234567'.split(''))).toBe('123 · 45 · 67');
    expect(formatChunkedSequence('12345678'.split(''))).toBe('123 · 456 · 78');
    expect(formatChunkedSequence(['CAT', 'SUN', 'MAP'], true)).toBe('CAT · SUN · MAP');
  });
});

describe('analyzeSequenceDiff (two-pass digit & token diff)', () => {
  it('reports 100% match when sequence equals expected', () => {
    const res = analyzeSequenceDiff({
      expected: '90366892',
      userTyped: '90366892',
      rawStimulus: '90366892',
      rule: 'forward'
    });
    expect(res.exactCount).toBe(8);
    expect(res.transposedCount).toBe(0);
    expect(res.wrongCount).toBe(0);
    expect(res.missingCount).toBe(0);
    expect(res.matchPercent).toBe(100);
    expect(res.forgotRuleTransform).toBe(false);
    expect(res.items.every(it => it.status === 'exact')).toBe(true);
  });

  it('detects adjacent swaps with targetPosIndex and shiftDelta', () => {
    const res = analyzeSequenceDiff({
      expected: '12345',
      userTyped: '13245',
      rule: 'forward'
    });
    expect(res.exactCount).toBe(3);
    expect(res.transposedCount).toBe(2);
    expect(res.wrongCount).toBe(0);
    expect(res.items[1]).toMatchObject({
      status: 'transposed',
      targetPosIndex: 2,
      shiftDelta: 1,
      isAdjacentSwap: true
    });
    expect(res.items[2]).toMatchObject({
      status: 'transposed',
      targetPosIndex: 1,
      shiftDelta: -1,
      isAdjacentSwap: true
    });
  });

  it('locks exact matches in pass 1 so duplicate characters cannot be misclassified as transposed', () => {
    // Expected has one '2' at idx 1 (matched exactly by user's idx 1).
    // User typed an extra '2' at idx 2 instead of '9'. Index 2 MUST be 'wrong', not 'transposed'.
    const res = analyzeSequenceDiff({
      expected: '529',
      userTyped: '522',
      rule: 'forward'
    });
    expect(res.exactCount).toBe(2);
    expect(res.transposedCount).toBe(0);
    expect(res.wrongCount).toBe(1);
    expect(res.items[0].status).toBe('exact');
    expect(res.items[1].status).toBe('exact');
    expect(res.items[2]).toMatchObject({
      status: 'wrong',
      expectedChar: '9',
      userChar: '2',
      numericDelta: -7
    });
  });

  it('marks trailing omitted slots as missing when input is shorter', () => {
    const res = analyzeSequenceDiff({
      expected: '481516',
      userTyped: '481',
      rule: 'forward'
    });
    expect(res.exactCount).toBe(3);
    expect(res.missingCount).toBe(3);
    expect(res.items[3].status).toBe('missing');
    expect(res.items[5].userChar).toBe('');
  });

  it('detects forgotRuleTransform across reverse, sort-asc, and plus-one rules', () => {
    const revForgot = analyzeSequenceDiff({
      rawStimulus: '4829',
      expected: '9284',
      userTyped: '4829',
      rule: 'reverse'
    });
    expect(revForgot.forgotRuleTransform).toBe(true);
    expect(revForgot.diagnosisVi).toContain('ĐẢO NGƯỢC');

    const sortForgot = analyzeSequenceDiff({
      rawStimulus: '7391',
      expected: '1379',
      userTyped: '7391',
      rule: 'sort-asc'
    });
    expect(sortForgot.forgotRuleTransform).toBe(true);
    expect(sortForgot.diagnosisVi).toContain('TĂNG DẦN');

    const plusForgot = analyzeSequenceDiff({
      rawStimulus: '259',
      expected: '360',
      userTyped: '259',
      rule: 'plus-one'
    });
    expect(plusForgot.forgotRuleTransform).toBe(true);
    expect(plusForgot.diagnosisVi).toContain('+1');
  });
});

describe('analyzeSpatialDiff (Corsi spatial block diagnostics)', () => {
  it('diagnoses forgot-reverse when user taps rawSequence[0] on step 0 in reverse mode', () => {
    const raw = [0, 5, 10, 15]; // 4x4 grid corners/diagonal
    const expected = [15, 10, 5, 0];
    const res = analyzeSpatialDiff({
      rawSequence: raw,
      expectedSequence: expected,
      userInputs: [0],
      gridSize: 4,
      isReverse: true
    });
    expect(res.errorType).toBe('forgot-reverse');
    expect(res.failStep).toBe(0);
    expect(res.expectedBlock).toBe(15);
    expect(res.tappedBlock).toBe(0);
  });

  it('diagnoses order-shift when tapping a valid sequence cell out of order', () => {
    const seq = [1, 6, 9, 14];
    const res = analyzeSpatialDiff({
      rawSequence: seq,
      expectedSequence: seq,
      userInputs: [1, 9], // skipped block 6 (step 1) and tapped block 9 (step 2)
      gridSize: 4,
      isReverse: false
    });
    expect(res.errorType).toBe('order-shift');
    expect(res.failStep).toBe(1);
    expect(res.tappedStepInExpected).toBe(2);
    expect(res.expectedBlock).toBe(6);
  });

  it('diagnoses trap-block when isTrap is true', () => {
    const seq = [0, 2, 7];
    const res = analyzeSpatialDiff({
      rawSequence: seq,
      expectedSequence: seq,
      userInputs: [0, 12],
      gridSize: 4,
      isReverse: false,
      isTrap: true
    });
    expect(res.errorType).toBe('trap-block');
    expect(res.diagnosisVi).toContain('BẪY');
  });

  it('computes exact rowDelta, colDelta, and manhattanDist for wrong-cell misses', () => {
    // 4x4 grid: block 5 is row 1, col 1; block 6 is row 1, col 2 -> colDelta = +1, rowDelta = 0
    const seq = [0, 5, 15];
    const res = analyzeSpatialDiff({
      rawSequence: seq,
      expectedSequence: seq,
      userInputs: [0, 6],
      gridSize: 4,
      isReverse: false
    });
    expect(res.errorType).toBe('wrong-cell');
    expect(res.rowDelta).toBe(0);
    expect(res.colDelta).toBe(1);
    expect(res.manhattanDist).toBe(1);
  });
});
