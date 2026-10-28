import { ExerciseSlug } from '../types';
export type NumberParamField = {
    kind: 'number';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    default: number;
};
export type EnumParamField = {
    kind: 'enum';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    options: Array<{
        value: string;
        labelVi: string;
        descriptionVi?: string;
    }>;
    default: string;
};
export type MultiEnumParamField = {
    kind: 'multiEnum';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    options: Array<{
        value: string;
        labelVi: string;
        group?: string;
    }>;
    minSelected?: number;
    default: string[];
};
export type BooleanParamField = {
    kind: 'boolean';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    default: boolean;
};
export type ScaleRefParamField = {
    kind: 'scaleRef';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    multi: boolean;
    default: string | string[];
};
export type NoteRefParamField = {
    kind: 'noteRef';
    key: string;
    labelVi: string;
    descriptionVi?: string;
    multi: boolean;
    default: string | string[];
};
export type ParamField = NumberParamField | EnumParamField | MultiEnumParamField | BooleanParamField | ScaleRefParamField | NoteRefParamField;
export interface IParamCondition {
    field: string;
    equals?: unknown;
    in?: unknown[];
}
export interface IParamSchema {
    version: number;
    fields: ParamField[];
    visibleWhen?: Record<string, IParamCondition>;
}
export interface IBuiltInPreset<P = Record<string, unknown>> {
    id: string;
    labelVi: string;
    descriptionVi?: string;
    params: Partial<P>;
}
export interface IExerciseModeDefinition<P = Record<string, unknown>> {
    id: string;
    exerciseSlug: ExerciseSlug;
    labelVi: string;
    descriptionVi: string;
    status: 'stable' | 'beta' | 'planned';
    unlockLevel?: number;
    schema: IParamSchema;
    builtInPresets?: IBuiltInPreset<P>[];
    migrate?: (oldParams: unknown, fromVersion: number) => P;
}
export interface ICustomExercisePreset {
    id: string;
    exerciseSlug: ExerciseSlug;
    modeId: string;
    name: string;
    schemaVersion: number;
    params: Record<string, unknown>;
    session: {
        rounds: number;
        timeLimitSec: number | null;
    };
    createdAt: string;
    updatedAt: string;
}
export interface IResolvedSessionConfig<P = Record<string, unknown>> {
    source: 'ladder' | 'custom';
    exerciseSlug: ExerciseSlug;
    level: number;
    modeId: string;
    modeLabelVi: string;
    params: P;
    rounds: number;
    timeLimitSec: number | null;
    presetId?: string;
    presetName?: string;
}
//# sourceMappingURL=types.d.ts.map