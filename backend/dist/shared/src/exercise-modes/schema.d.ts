import { IParamSchema } from './types';
export declare function isFieldVisible(fieldKey: string, currentValues: Record<string, unknown>, schema: IParamSchema): boolean;
export declare function validateAndSanitizeParams(schema: IParamSchema, rawParams: unknown): {
    params: Record<string, unknown>;
    warnings: string[];
};
export declare function getDefaultParams(schema: IParamSchema): Record<string, unknown>;
