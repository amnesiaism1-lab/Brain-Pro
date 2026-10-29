import { ExerciseSlug } from '../types';
export interface IExerciseCognitiveRationale {
    exerciseSlug: ExerciseSlug;
    coreTheoryVi: string;
    neuralMechanismVi: string;
    realWorldValueVi: string;
    goldenRuleVi: string;
    targetFunctionsVi: string[];
    academicCitationVi?: string;
}
export declare const EXERCISE_COGNITIVE_RATIONALES: Record<ExerciseSlug, IExerciseCognitiveRationale>;
/**
 * Lấy cơ sở khoa học & giá trị nhận thức chuẩn cho bất kỳ bài tập nào
 */
export declare function getExerciseRationale(slug: ExerciseSlug): IExerciseCognitiveRationale;
//# sourceMappingURL=exercise-rationales.d.ts.map