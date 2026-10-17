"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
(0, vitest_1.describe)('Dual N-Back metadata and relation mapping integrity', () => {
    (0, vitest_1.it)('registers dual-nback in EXERCISES_METADATA with memory category', () => {
        const dualNBack = index_1.EXERCISES_METADATA.find(e => e.slug === 'dual-nback');
        (0, vitest_1.expect)(dualNBack).toBeDefined();
        (0, vitest_1.expect)(dualNBack?.title).toBe('Dual N-Back');
        (0, vitest_1.expect)(dualNBack?.categoryCode).toBe('MEMORY');
        (0, vitest_1.expect)(dualNBack?.levelConfigs.length).toBeGreaterThanOrEqual(22);
    });
    (0, vitest_1.it)('maps dual-nback to primary cognitive relation in EXERCISE_RELATION_MAP', () => {
        const mapping = index_1.EXERCISE_RELATION_MAP['dual-nback'];
        (0, vitest_1.expect)(mapping).toBeDefined();
        (0, vitest_1.expect)(mapping.primaryRelation).toBe('IDENTITY_MATCH');
        (0, vitest_1.expect)(mapping.secondaryRelations).toContain('TEMPORAL_PREDICT');
        (0, vitest_1.expect)(mapping.secondaryRelations).toContain('TARGET_POSITION');
    });
    (0, vitest_1.it)('configures Infinity tiers I to X for dual-nback', () => {
        const infinityTiers = index_1.INFINITY_LEVEL_CONFIGS['dual-nback'];
        (0, vitest_1.expect)(infinityTiers).toBeDefined();
        (0, vitest_1.expect)(infinityTiers).toHaveLength(10);
        (0, vitest_1.expect)(infinityTiers[0].infinityTier).toBe(1);
        (0, vitest_1.expect)(infinityTiers[0].level).toBe(13);
        (0, vitest_1.expect)(infinityTiers[9].infinityTier).toBe(10);
        (0, vitest_1.expect)(infinityTiers[9].level).toBe(22);
    });
    (0, vitest_1.it)('verifies MEMORY category exists in COGNITIVE_CATEGORIES', () => {
        const memoryCat = index_1.COGNITIVE_CATEGORIES.find(c => c.code === 'MEMORY');
        (0, vitest_1.expect)(memoryCat).toBeDefined();
        (0, vitest_1.expect)(memoryCat?.name).toBe('Trí Nhớ Làm Việc');
    });
});
