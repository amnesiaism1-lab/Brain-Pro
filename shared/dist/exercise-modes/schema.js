"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFieldVisible = isFieldVisible;
exports.validateAndSanitizeParams = validateAndSanitizeParams;
exports.getDefaultParams = getDefaultParams;
/**
 * Checks if a parameter field should be visible given current parameter values and conditions.
 */
function isFieldVisible(fieldKey, currentValues, schema) {
    if (!schema.visibleWhen || !schema.visibleWhen[fieldKey]) {
        return true;
    }
    const cond = schema.visibleWhen[fieldKey];
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
function validateAndSanitizeParams(schema, rawParams) {
    const result = {};
    const warnings = [];
    const input = (rawParams && typeof rawParams === 'object') ? rawParams : {};
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
                }
                else {
                    result[field.key] = field.default;
                }
                break;
            }
            case 'enum': {
                const allowed = field.options.map(o => o.value);
                if (typeof rawVal === 'string' && allowed.includes(rawVal)) {
                    result[field.key] = rawVal;
                }
                else {
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
                    }
                    else {
                        result[field.key] = [...field.default];
                    }
                }
                else {
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
                    }
                    else {
                        result[field.key] = Array.isArray(field.default) ? [...field.default] : [field.default];
                    }
                }
                else {
                    result[field.key] = typeof rawVal === 'string' && rawVal.length > 0 ? rawVal : field.default;
                }
                break;
            }
            case 'noteRef': {
                if (field.multi) {
                    if (Array.isArray(rawVal) && rawVal.length > 0) {
                        result[field.key] = rawVal.filter(s => typeof s === 'string');
                    }
                    else {
                        result[field.key] = Array.isArray(field.default) ? [...field.default] : [field.default];
                    }
                }
                else {
                    result[field.key] = typeof rawVal === 'string' && rawVal.length > 0 ? rawVal : field.default;
                }
                break;
            }
            default:
                result[field.key] = field.default;
                break;
        }
    }
    return { params: result, warnings };
}
/**
 * Creates default parameter object from a schema.
 */
function getDefaultParams(schema) {
    const defaults = {};
    for (const field of schema.fields) {
        if (Array.isArray(field.default)) {
            defaults[field.key] = [...field.default];
        }
        else {
            defaults[field.key] = field.default;
        }
    }
    return defaults;
}
