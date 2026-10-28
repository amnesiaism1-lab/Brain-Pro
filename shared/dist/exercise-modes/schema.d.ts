import { IParamSchema } from './types';
/**
 * Checks if a parameter field should be visible given current parameter values and conditions.
 */
export declare function isFieldVisible(fieldKey: string, currentValues: Record<string, unknown>, schema: IParamSchema): boolean;
/**
 * Validates, clamps, and fills defaults for raw parameter objects according to their schema.
 * Never throws an error; returns sanitized values and human-readable warnings.
 */
export declare function validateAndSanitizeParams(schema: IParamSchema, rawParams: unknown): {
    params: Record<string, unknown>;
    warnings: string[];
};
/**
 * Creates default parameter object from a schema.
 */
export declare function getDefaultParams(schema: IParamSchema): Record<string, unknown>;
//# sourceMappingURL=schema.d.ts.map