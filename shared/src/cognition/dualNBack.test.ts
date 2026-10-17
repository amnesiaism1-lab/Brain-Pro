import { describe, it, expect } from 'vitest';
import { 
  EXERCISES_METADATA, 
  EXERCISE_RELATION_MAP, 
  INFINITY_LEVEL_CONFIGS,
  COGNITIVE_CATEGORIES
} from '../index';

describe('Dual N-Back metadata and relation mapping integrity', () => {
  it('registers dual-nback in EXERCISES_METADATA with memory category', () => {
    const dualNBack = EXERCISES_METADATA.find(e => e.slug === 'dual-nback');
    expect(dualNBack).toBeDefined();
    expect(dualNBack?.title).toBe('Dual N-Back');
    expect(dualNBack?.categoryCode).toBe('MEMORY');
    expect(dualNBack?.levelConfigs.length).toBeGreaterThanOrEqual(22);
  });

  it('maps dual-nback to primary cognitive relation in EXERCISE_RELATION_MAP', () => {
    const mapping = EXERCISE_RELATION_MAP['dual-nback'];
    expect(mapping).toBeDefined();
    expect(mapping.primaryRelation).toBe('IDENTITY_MATCH');
    expect(mapping.secondaryRelations).toContain('TEMPORAL_PREDICT');
    expect(mapping.secondaryRelations).toContain('TARGET_POSITION');
  });

  it('configures Infinity tiers I to X for dual-nback', () => {
    const infinityTiers = INFINITY_LEVEL_CONFIGS['dual-nback'];
    expect(infinityTiers).toBeDefined();
    expect(infinityTiers).toHaveLength(10);
    expect(infinityTiers[0].infinityTier).toBe(1);
    expect(infinityTiers[0].level).toBe(13);
    expect(infinityTiers[9].infinityTier).toBe(10);
    expect(infinityTiers[9].level).toBe(22);
  });

  it('verifies MEMORY category exists in COGNITIVE_CATEGORIES', () => {
    const memoryCat = COGNITIVE_CATEGORIES.find(c => c.code === 'MEMORY');
    expect(memoryCat).toBeDefined();
    expect(memoryCat?.name).toBe('Trí Nhớ Làm Việc');
  });
});
