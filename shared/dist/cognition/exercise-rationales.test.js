"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const exercise_rationales_1 = require("./exercise-rationales");
const constants_1 = require("../constants");
(0, vitest_1.describe)('exercise-rationales', () => {
    (0, vitest_1.it)('covers all exercises defined in EXERCISES_METADATA', () => {
        const allSlugs = constants_1.EXERCISES_METADATA.map(e => e.slug);
        (0, vitest_1.expect)(allSlugs.length).toBeGreaterThanOrEqual(30);
        for (const slug of allSlugs) {
            const rationale = (0, exercise_rationales_1.getExerciseRationale)(slug);
            (0, vitest_1.expect)(rationale).toBeDefined();
            (0, vitest_1.expect)(rationale.exerciseSlug).toBe(slug);
            (0, vitest_1.expect)(rationale.coreTheoryVi.length).toBeGreaterThan(10);
            (0, vitest_1.expect)(rationale.neuralMechanismVi.length).toBeGreaterThan(20);
            (0, vitest_1.expect)(rationale.realWorldValueVi.length).toBeGreaterThan(20);
            (0, vitest_1.expect)(rationale.goldenRuleVi.length).toBeGreaterThan(15);
            (0, vitest_1.expect)(rationale.targetFunctionsVi.length).toBeGreaterThanOrEqual(3);
        }
    });
    (0, vitest_1.it)('provides detailed Kevin Lynch and dual-reference rationale for hanoi-navigation', () => {
        const hanoi = (0, exercise_rationales_1.getExerciseRationale)('hanoi-navigation');
        (0, vitest_1.expect)(hanoi.coreTheoryVi).toContain('Kevin Lynch');
        (0, vitest_1.expect)(hanoi.neuralMechanismVi).toContain('Hồi hải mã');
        (0, vitest_1.expect)(hanoi.neuralMechanismVi).toContain('Allocentric');
        (0, vitest_1.expect)(hanoi.targetFunctionsVi).toContain('Bản đồ Nhận thức Đô thị');
    });
    (0, vitest_1.it)('provides tonotopic and sensorimotor loop rationale for vocal-pitch-match', () => {
        const vocal = (0, exercise_rationales_1.getExerciseRationale)('vocal-pitch-match');
        (0, vitest_1.expect)(vocal.coreTheoryVi).toContain('Vòng Lặp Cảm Giác - Vận Động');
        (0, vitest_1.expect)(vocal.neuralMechanismVi).toContain('Vỏ não thính giác');
        (0, vitest_1.expect)(vocal.realWorldValueVi).toContain('Scale');
    });
});
