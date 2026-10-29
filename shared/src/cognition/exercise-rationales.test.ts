import { describe, it, expect } from 'vitest';
import { EXERCISE_COGNITIVE_RATIONALES, getExerciseRationale } from './exercise-rationales';
import { EXERCISES_METADATA } from '../constants';

describe('exercise-rationales', () => {
  it('covers all exercises defined in EXERCISES_METADATA', () => {
    const allSlugs = EXERCISES_METADATA.map(e => e.slug);
    expect(allSlugs.length).toBeGreaterThanOrEqual(30);

    for (const slug of allSlugs) {
      const rationale = getExerciseRationale(slug);
      expect(rationale).toBeDefined();
      expect(rationale.exerciseSlug).toBe(slug);
      expect(rationale.coreTheoryVi.length).toBeGreaterThan(10);
      expect(rationale.neuralMechanismVi.length).toBeGreaterThan(20);
      expect(rationale.realWorldValueVi.length).toBeGreaterThan(20);
      expect(rationale.goldenRuleVi.length).toBeGreaterThan(15);
      expect(rationale.targetFunctionsVi.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('provides detailed Kevin Lynch and dual-reference rationale for hanoi-navigation', () => {
    const hanoi = getExerciseRationale('hanoi-navigation');
    expect(hanoi.coreTheoryVi).toContain('Kevin Lynch');
    expect(hanoi.neuralMechanismVi).toContain('Hồi hải mã');
    expect(hanoi.neuralMechanismVi).toContain('Allocentric');
    expect(hanoi.targetFunctionsVi).toContain('Bản đồ Nhận thức Đô thị');
  });

  it('provides tonotopic and sensorimotor loop rationale for vocal-pitch-match', () => {
    const vocal = getExerciseRationale('vocal-pitch-match');
    expect(vocal.coreTheoryVi).toContain('Vòng Lặp Cảm Giác - Vận Động');
    expect(vocal.neuralMechanismVi).toContain('Vỏ não thính giác');
    expect(vocal.realWorldValueVi).toContain('Scale');
  });
});
