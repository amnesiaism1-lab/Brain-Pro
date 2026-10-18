import { describe, it, expect } from 'vitest';
import {
  THEORY_MODULE_MAP,
  THEORY_MODULE_LIST,
  getTheoryModuleForSlug,
  getTheoryModuleForWrongAnswer
} from '../theoryExerciseMap';

describe('theoryExerciseMap integrity & round-trip', () => {
  it('contains all 10 canonical theory modules with required properties', () => {
    expect(THEORY_MODULE_LIST).toHaveLength(10);
    for (const mod of THEORY_MODULE_LIST) {
      expect(mod.id).toBeDefined();
      expect(mod.title).toBeTruthy();
      expect(mod.shortTitle).toBeTruthy();
      expect(mod.icon).toBeTruthy();
      expect(mod.primaryEntity).toBeTruthy();
      expect(mod.primaryRelation).toBeTruthy();
      expect(mod.primarySlug).toBeTruthy();
      expect(mod.ctaLabelVi).toBeTruthy();
      expect(mod.relationBadgeVi).toBeTruthy();
    }
  });

  it('correctly maps exercise slugs to their primary theory module', () => {
    expect(getTheoryModuleForSlug('pitch-recall')).toBe('notes');
    expect(getTheoryModuleForSlug('vocal-pitch-match')).toBe('notes');
    expect(getTheoryModuleForSlug('interval-identify')).toBe('intervals');
    expect(getTheoryModuleForSlug('chord-identify')).toBe('chords');
    expect(getTheoryModuleForSlug('rhythm-recall')).toBe('rhythm');
    expect(getTheoryModuleForSlug('timbre-match')).toBe('timbre');
    expect(getTheoryModuleForSlug('sound-localization')).toBe('spatial');
    expect(getTheoryModuleForSlug('voice-track')).toBe('polyphony');
    expect(getTheoryModuleForSlug('hanoi-navigation')).toBe('hanoi-map');
  });

  it('returns undefined for unmapped slugs', () => {
    expect(getTheoryModuleForSlug('schulte-table' as any)).toBeUndefined();
    expect(getTheoryModuleForSlug('stroop-clash' as any)).toBeUndefined();
  });

  it('correctly handles wrong answer remediation context', () => {
    expect(getTheoryModuleForWrongAnswer('pitch-recall', { mode: 'dorian' })).toBe('scales');
    expect(getTheoryModuleForWrongAnswer('rhythm-recall', { isRest: true })).toBe('rhythm');
    expect(getTheoryModuleForWrongAnswer('chord-identify')).toBe('chords');
    expect(getTheoryModuleForWrongAnswer('interval-identify')).toBe('intervals');
    expect(getTheoryModuleForWrongAnswer('hanoi-navigation')).toBe('hanoi-map');
  });
});
