import { IParamSchema, ParamField, IParamCondition } from './types';

/**
 * Checks if a parameter field should be visible given current parameter values and conditions.
 */
export function isFieldVisible(
  fieldKey: string,
  currentValues: Record<string, unknown>,
  schema: IParamSchema
): boolean {
  if (!schema.visibleWhen || !schema.visibleWhen[fieldKey]) {
    return true;
  }

  const cond: IParamCondition = schema.visibleWhen[fieldKey];
  const targetVal = currentValues[cond.field];

  if (cond.equals !== undefined) {
    return targetVal === cond.equals;
  }
  if (Array.isArray(cond.in)) {
    return cond.in.includes(targetVal);
  }
  return true;
}

/**
 * Validates, clamps, and fills defaults for raw parameter objects according to their schema.
 * Never throws an error; returns sanitized values and human-readable warnings.
 */
export function validateAndSanitizeParams(
  schema: IParamSchema,
  rawParams: unknown
): { params: Record<string, unknown>; warnings: string[] } {
  const result: Record<string, unknown> = {};
  const warnings: string[] = [];

  const input = (rawParams && typeof rawParams === 'object') ? (rawParams as Record<string, unknown>) : {};

  for (const field of schema.fields) {
    const rawVal = input[field.key];

    switch (field.kind) {
      case 'number': {
        if (typeof rawVal === 'number' && !Number.isNaN(rawVal)) {
          const clamped = Math.max(field.min, Math.min(field.max, rawVal));
          if (clamped !== rawVal) {
            warnings.push(`Field '${field.key}' clamped from ${rawVal} to ${clamped}`);
          }
          result[field.key] = clamped;
        } else {
          result[field.key] = field.default;
        }
        break;
      }

      case 'enum': {
        const allowed = field.options.map(o => o.value);
        if (typeof rawVal === 'string' && allowed.includes(rawVal)) {
          result[field.key] = rawVal;
        } else {
          result[field.key] = field.default;
        }
        break;
      }

      case 'multiEnum': {
        const allowed = field.options.map(o => o.value);
        if (Array.isArray(rawVal)) {
          const validItems = rawVal.filter(item => typeof item === 'string' && allowed.includes(item));
          const minCount = field.minSelected ?? 1;
          if (validItems.length >= minCount) {
            result[field.key] = validItems;
          } else {
            result[field.key] = [...field.default];
          }
        } else {
          result[field.key] = [...field.default];
        }
        break;
      }

      case 'boolean': {
        result[field.key] = typeof rawVal === 'boolean' ? rawVal : field.default;
        break;
      }

      case 'scaleRef': {
        if (field.multi) {
          if (Array.isArray(rawVal) && rawVal.length > 0) {
            result[field.key] = rawVal.filter(s => typeof s === 'string');
          } else {
            result[field.key] = Array.isArray(field.default) ? [...field.default] : [field.default];
          }
        } else {
          result[field.key] = typeof rawVal === 'string' && rawVal.length > 0 ? rawVal : field.default;
        }
        break;
      }

      case 'noteRef': {
        if (field.multi) {
          if (Array.isArray(rawVal) && rawVal.length > 0) {
            result[field.key] = rawVal.filter(s => typeof s === 'string');
          } else {
            result[field.key] = Array.isArray(field.default) ? [...field.default] : [field.default];
          }
        } else {
          result[field.key] = typeof rawVal === 'string' && rawVal.length > 0 ? rawVal : field.default;
        }
        break;
      }

      default:
        result[(field as ParamField).key] = (field as ParamField).default;
        break;
    }
  }

  return { params: result, warnings };
}

/**
 * Creates default parameter object from a schema.
 */
export function getDefaultParams(schema: IParamSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (Array.isArray(field.default)) {
      defaults[field.key] = [...field.default];
    } else {
      defaults[field.key] = field.default;
    }
  }
  return defaults;
}
