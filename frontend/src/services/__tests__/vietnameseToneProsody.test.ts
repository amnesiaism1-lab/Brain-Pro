import { describe, it, expect } from 'vitest';
import {
  getVietnameseToneType,
  getVietnameseToneInfo,
  TONE_PITCH_RANK,
  computeToneMelodicTransitionCost,
  computeSpearmanRankCorrelation,
  computePhraseToneMelodicHarmony,
  filterOrScoreCandidateAlignment,
} from '../vietnameseToneProsodyService';

describe('vietnameseToneProsodyService', () => {
  describe('getVietnameseToneType & getVietnameseToneInfo', () => {
    it('correctly classifies Vietnamese 6 lexical tones via Unicode NFD decomposition', () => {
      // Thanh Nặng (Glottalized low falling)
      expect(getVietnameseToneType('mẹ')).toBe('nang');
      expect(getVietnameseToneType('nặng')).toBe('nang');
      expect(getVietnameseToneType('lại')).toBe('nang');
      expect(getVietnameseToneType('được')).toBe('nang');
      expect(getVietnameseToneType('một')).toBe('nang');

      // Thanh Huyền (Low falling)
      expect(getVietnameseToneType('bà')).toBe('huyen');
      expect(getVietnameseToneType('huyền')).toBe('huyen');
      expect(getVietnameseToneType('mùa')).toBe('huyen');
      expect(getVietnameseToneType('đời')).toBe('huyen');

      // Thanh Ngang / Bằng (Mid level)
      expect(getVietnameseToneType('anh')).toBe('ngang');
      expect(getVietnameseToneType('em')).toBe('ngang');
      expect(getVietnameseToneType('hoa')).toBe('ngang');
      expect(getVietnameseToneType('trong')).toBe('ngang');

      // Thanh Hỏi (Dipping rising)
      expect(getVietnameseToneType('hỏi')).toBe('hoi');
      expect(getVietnameseToneType('thể')).toBe('hoi');
      expect(getVietnameseToneType('cả')).toBe('hoi');
      expect(getVietnameseToneType('ngủ')).toBe('hoi');

      // Thanh Ngã (High broken)
      expect(getVietnameseToneType('ngã')).toBe('nga');
      expect(getVietnameseToneType('sẽ')).toBe('nga');
      expect(getVietnameseToneType('mãi')).toBe('nga');
      expect(getVietnameseToneType('những')).toBe('nga');

      // Thanh Sắc (High rising)
      expect(getVietnameseToneType('sắc')).toBe('sac');
      expect(getVietnameseToneType('kính')).toBe('sac');
      expect(getVietnameseToneType('nhớ')).toBe('sac');
      expect(getVietnameseToneType('hát')).toBe('sac');
      expect(getVietnameseToneType('nắng')).toBe('sac');
    });

    it('adheres to the standardized Relative Pitch Hierarchy Scale', () => {
      expect(TONE_PITCH_RANK['nang']).toBeLessThan(TONE_PITCH_RANK['huyen']);
      expect(TONE_PITCH_RANK['huyen']).toBeLessThan(TONE_PITCH_RANK['ngang']);
      expect(TONE_PITCH_RANK['ngang']).toBeLessThan(TONE_PITCH_RANK['hoi']);
      expect(TONE_PITCH_RANK['hoi']).toBeLessThan(TONE_PITCH_RANK['nga']);
      expect(TONE_PITCH_RANK['nga']).toBeLessThan(TONE_PITCH_RANK['sac']);
    });

    it('provides detailed musical role metadata for each tone', () => {
      const infoNang = getVietnameseToneInfo('mẹ');
      expect(infoNang.toneNameVi).toBe('Thanh Nặng');
      expect(infoNang.toneRank).toBe(1.0);
      expect(infoNang.musicalRoleVi).toContain('Nốt trầm');

      const infoSac = getVietnameseToneInfo('kính');
      expect(infoSac.toneNameVi).toBe('Thanh Sắc');
      expect(infoSac.toneRank).toBe(5.0);
      expect(infoSac.musicalRoleVi).toContain('Đỉnh cao');
    });
  });

  describe('computeToneMelodicTransitionCost (Inter-Syllable Concordance Matrix)', () => {
    it('rewards concordant upward transitions (Nặng -> Sắc with rising pitch)', () => {
      // "mẹ" (Rank 1.0) -> "kính" (Rank 5.0), MIDI 60 (C4) -> 67 (G4)
      const result = computeToneMelodicTransitionCost('mẹ', 'kính', 60, 67);
      expect(result.isConcordant).toBe(true);
      expect(result.isInverted).toBe(false);
      expect(result.penaltyOrBonusCost).toBeLessThan(0); // Negative cost = bonus
    });

    it('penalizes severe inverted transitions (Nặng -> Sắc with dropping pitch)', () => {
      // "mẹ" (Rank 1.0) -> "kính" (Rank 5.0), but melody drops from 67 down to 60! (Ngọng dấu)
      const result = computeToneMelodicTransitionCost('mẹ', 'kính', 67, 60);
      expect(result.isConcordant).toBe(false);
      expect(result.isInverted).toBe(true);
      expect(result.violationSeverity).toBe('severe');
      expect(result.penaltyOrBonusCost).toBeGreaterThan(12.0); // Severe penalty
      expect(result.explanationVi).toContain('Nghịch thanh nghiêm trọng');
    });

    it('rewards concordant downward transitions (Sắc -> Nặng with falling pitch)', () => {
      // "nắng" (Rank 5.0) -> "hạ" (Rank 1.0), MIDI 67 -> 60
      const result = computeToneMelodicTransitionCost('nắng', 'hạ', 67, 60);
      expect(result.isConcordant).toBe(true);
      expect(result.isInverted).toBe(false);
      expect(result.penaltyOrBonusCost).toBeLessThan(0);
    });

    it('penalizes inverted downward transitions (Sắc -> Nặng with rising pitch)', () => {
      // "nắng" (Rank 5.0) -> "hạ" (Rank 1.0), but melody rises from 60 to 67!
      const result = computeToneMelodicTransitionCost('nắng', 'hạ', 60, 67);
      expect(result.isInverted).toBe(true);
      expect(result.violationSeverity).toBe('severe');
      expect(result.penaltyOrBonusCost).toBeGreaterThan(12.0);
    });
  });

  describe('computePhraseToneMelodicHarmony & Global Anchors', () => {
    it('evaluates a natural Vietnamese phrase with high prosodic score and correct anchors', () => {
      // "Mẹ kính yêu" -> Nặng (Rank 1), Sắc (Rank 5), Ngang (Rank 3)
      // Melody: 60 (C4, trầm), 67 (G4, cao đỉnh), 64 (E4, trung bình)
      const report = computePhraseToneMelodicHarmony(['mẹ', 'kính', 'yêu'], [60, 67, 64]);
      expect(report.concordanceRatioPercent).toBe(100);
      expect(report.invertedViolationsCount).toBe(0);
      expect(report.overallScorePercent).toBeGreaterThanOrEqual(85);
      expect(report.lowestToneAnchorCheck.passed).toBe(true);
      expect(report.highestToneAnchorCheck.passed).toBe(true);
      expect(report.lowestToneAnchorCheck.lowestMidiWord).toBe('mẹ');
      expect(report.highestToneAnchorCheck.highestMidiWord).toBe('kính');
    });

    it('detects inverted violations when phrase melody runs opposite to tones', () => {
      // Inverted melody: "mẹ" (Nặng, Rank 1) on high pitch 67, "kính" (Sắc, Rank 5) on low pitch 58
      const report = computePhraseToneMelodicHarmony(['mẹ', 'kính', 'yêu'], [67, 58, 64]);
      expect(report.invertedViolationsCount).toBeGreaterThan(0);
      expect(report.overallScorePercent).toBeLessThan(75);
      expect(report.lowestToneAnchorCheck.passed).toBe(false); // Lowest note was on "kính" (sac)
      expect(report.highestToneAnchorCheck.passed).toBe(false); // Highest note was on "mẹ" (nang)
    });
  });

  describe('computeSpearmanRankCorrelation', () => {
    it('yields 1.0 for perfectly monotonic matching series', () => {
      const rho = computeSpearmanRankCorrelation([1, 2, 3, 4], [10, 20, 30, 40]);
      expect(rho).toBe(1.0);
    });

    it('yields -1.0 for completely inverted series', () => {
      const rho = computeSpearmanRankCorrelation([1, 2, 3, 4], [40, 30, 20, 10]);
      expect(rho).toBe(-1.0);
    });
  });

  describe('filterOrScoreCandidateAlignment', () => {
    it('returns low penalty for natural alignments and high penalty for unnatural ones', () => {
      const goodCost = filterOrScoreCandidateAlignment(['mẹ', 'kính', 'yêu'], [60, 67, 64]);
      const badCost = filterOrScoreCandidateAlignment(['mẹ', 'kính', 'yêu'], [67, 58, 64]);
      expect(goodCost).toBeLessThan(badCost);
    });
  });
});

