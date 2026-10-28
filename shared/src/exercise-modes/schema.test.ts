import { describe, it, expect } from 'vitest';
import { validateAndSanitizeParams, isFieldVisible } from './schema';
import { IParamSchema } from './types';

describe('Exercise Mode Schema Validator', () => {
  const testSchema: IParamSchema = {
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

  it('clamps numbers exceeding boundaries and reports warnings', () => {
    const { params, warnings } = validateAndSanitizeParams(testSchema, { centsTolerance: 999 });
    expect(params.centsTolerance).toBe(50);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('clamps numbers below minimum', () => {
    const { params } = validateAndSanitizeParams(testSchema, { centsTolerance: 2 });
    expect(params.centsTolerance).toBe(10);
  });

  it('falls back to default if enum value is invalid', () => {
    const { params } = validateAndSanitizeParams(testSchema, { selectionMode: 'INVALID_ENUM' });
    expect(params.selectionMode).toBe('random');
  });

  it('handles multiEnum and filters unknown values', () => {
    const { params } = validateAndSanitizeParams(testSchema, { selectedPool: ['A', 'UNKNOWN_XYZ'] });
    expect(params.selectedPool).toEqual(['A']);
  });

  it('evaluates visibleWhen conditions correctly', () => {
    expect(isFieldVisible('fixedScale', { selectionMode: 'random' }, testSchema)).toBe(false);
    expect(isFieldVisible('fixedScale', { selectionMode: 'fixed' }, testSchema)).toBe(true);
  });
});
