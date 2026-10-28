"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schema_1 = require("./schema");
(0, vitest_1.describe)('Exercise Mode Schema Validator', () => {
    const testSchema = {
        version: 1,
        fields: [
            {
                kind: 'number',
                key: 'centsTolerance',
                labelVi: 'Sai số',
                min: 10,
                max: 50,
                default: 25
            },
            {
                kind: 'enum',
                key: 'selectionMode',
                labelVi: 'Chế độ',
                options: [
                    { value: 'random', labelVi: 'Ngẫu nhiên' },
                    { value: 'fixed', labelVi: 'Cố định' }
                ],
                default: 'random'
            },
            {
                kind: 'scaleRef',
                key: 'fixedScale',
                labelVi: 'Scale cố định',
                multi: false,
                default: 'major'
            },
            {
                kind: 'multiEnum',
                key: 'selectedPool',
                labelVi: 'Danh sách',
                options: [
                    { value: 'A', labelVi: 'A' },
                    { value: 'B', labelVi: 'B' },
                    { value: 'C', labelVi: 'C' }
                ],
                minSelected: 1,
                default: ['A', 'B']
            }
        ],
        visibleWhen: {
            fixedScale: { field: 'selectionMode', equals: 'fixed' }
        }
    };
    (0, vitest_1.it)('clamps numbers exceeding boundaries and reports warnings', () => {
        const { params, warnings } = (0, schema_1.validateAndSanitizeParams)(testSchema, { centsTolerance: 999 });
        (0, vitest_1.expect)(params.centsTolerance).toBe(50);
        (0, vitest_1.expect)(warnings.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('clamps numbers below minimum', () => {
        const { params } = (0, schema_1.validateAndSanitizeParams)(testSchema, { centsTolerance: 2 });
        (0, vitest_1.expect)(params.centsTolerance).toBe(10);
    });
    (0, vitest_1.it)('falls back to default if enum value is invalid', () => {
        const { params } = (0, schema_1.validateAndSanitizeParams)(testSchema, { selectionMode: 'INVALID_ENUM' });
        (0, vitest_1.expect)(params.selectionMode).toBe('random');
    });
    (0, vitest_1.it)('handles multiEnum and filters unknown values', () => {
        const { params } = (0, schema_1.validateAndSanitizeParams)(testSchema, { selectedPool: ['A', 'UNKNOWN_XYZ'] });
        (0, vitest_1.expect)(params.selectedPool).toEqual(['A']);
    });
    (0, vitest_1.it)('evaluates visibleWhen conditions correctly', () => {
        (0, vitest_1.expect)((0, schema_1.isFieldVisible)('fixedScale', { selectionMode: 'random' }, testSchema)).toBe(false);
        (0, vitest_1.expect)((0, schema_1.isFieldVisible)('fixedScale', { selectionMode: 'fixed' }, testSchema)).toBe(true);
    });
});
