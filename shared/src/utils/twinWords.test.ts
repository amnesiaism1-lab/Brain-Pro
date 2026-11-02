import { describe, it, expect } from 'vitest';
import { 
  generateTwinWords,
  VIETNAMESE_SINGLE_SYLLABLE_PAIRS,
  VIETNAMESE_CONFUSABLE_PAIRS,
  VIETNAMESE_SENTENCE_PAIRS,
  VIETNAMESE_CONTEXTUAL_PAIRS,
  EXERCISES_METADATA
} from '../index';

describe('Twin Words Educational Engine & Utilities', () => {
  it('generateTwinWords returns exact match when shouldMatch is true', () => {
    const res = generateTwinWords('TRÍ TUỆ', true);
    expect(res.isMatch).toBe(true);
    expect(res.word1).toBe('TRÍ TUỆ');
    expect(res.word2).toBe('TRÍ TUỆ');
  });

  it('generateTwinWords mutates correctly and returns diffIndex when shouldMatch is false', () => {
    const res = generateTwinWords('HỌC', false);
    expect(res.isMatch).toBe(false);
    expect(res.word1).toBe('HỌC');
    expect(res.word2).not.toBe('HỌC');
    expect(typeof res.diffIndex).toBe('number');
  });

  it('VIETNAMESE_SINGLE_SYLLABLE_PAIRS contains valid 1-syllable Vietnamese words for Level 1', () => {
    expect(VIETNAMESE_SINGLE_SYLLABLE_PAIRS.length).toBeGreaterThanOrEqual(15);
    for (const pair of VIETNAMESE_SINGLE_SYLLABLE_PAIRS) {
      expect(pair.wordA.trim()).not.toContain(' ');
      expect(pair.wordB.trim()).not.toContain(' ');
      expect(pair.wordA.length).toBeGreaterThanOrEqual(2);
      expect(pair.wordB.length).toBeGreaterThanOrEqual(2);
      if (!pair.isMatch) {
        expect(pair.wordA).not.toBe(pair.wordB);
      } else {
        expect(pair.wordA).toBe(pair.wordB);
      }
    }
  });

  it('VIETNAMESE_CONFUSABLE_PAIRS contains educational spelling notes and sentences for Levels 2-8', () => {
    expect(VIETNAMESE_CONFUSABLE_PAIRS.length).toBeGreaterThanOrEqual(15);
    for (const pair of VIETNAMESE_CONFUSABLE_PAIRS) {
      expect(pair.correct).toBeTruthy();
      expect(pair.confusable).toBeTruthy();
      expect(pair.correct).not.toBe(pair.confusable);
      expect(pair.note).toBeTruthy();
      expect(pair.note.length).toBeGreaterThan(10);
    }
  });

  it('VIETNAMESE_SENTENCE_PAIRS contains valid sentence pairs for Level 10 (SENTENCE_TWINS)', () => {
    expect(VIETNAMESE_SENTENCE_PAIRS.length).toBeGreaterThanOrEqual(5);
    for (const pair of VIETNAMESE_SENTENCE_PAIRS) {
      expect(pair.sentenceA.length).toBeGreaterThan(15);
      expect(pair.sentenceB.length).toBeGreaterThan(15);
      if (!pair.isMatch) {
        expect(pair.sentenceA).not.toBe(pair.sentenceB);
        expect(pair.diffWord).toBeTruthy();
      }
    }
  });

  it('VIETNAMESE_CONTEXTUAL_PAIRS contains cloze sentences and explanations for Level 12 (CONTEXTUAL_TWINS)', () => {
    expect(VIETNAMESE_CONTEXTUAL_PAIRS.length).toBeGreaterThanOrEqual(4);
    for (const pair of VIETNAMESE_CONTEXTUAL_PAIRS) {
      expect(pair.contextSentence).toContain('[...]');
      expect(pair.correctWord).toBeTruthy();
      expect(pair.explanation).toBeTruthy();
    }
  });

  it('EXERCISES_METADATA twin-words levelConfigs has countdown time limits defined', () => {
    const meta = EXERCISES_METADATA.find(e => e.slug === 'twin-words');
    expect(meta).toBeDefined();
    expect(meta?.levelConfigs.length).toBeGreaterThanOrEqual(12);
    expect(meta?.levelConfigs[0].timeLimitSec).toBe(30);
    expect(meta?.levelConfigs[9].variantCode).toBe('SENTENCE_TWINS');
    expect(meta?.levelConfigs[11].variantCode).toBe('CONTEXTUAL_TWINS');
  });
});
