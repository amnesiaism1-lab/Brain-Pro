import { AuditoryErrorCategory, ErrorSeverity, IAnswerDetail, IQuestionContext, IWrongAnswer, ExerciseSlug } from '../types';
export declare function generateConfusionPairKey(codeA: string, codeB: string): string;
export declare function calculateErrorSeverity(category: AuditoryErrorCategory, delta?: {
    semitones?: number;
    cents?: number;
    timingMs?: number;
    azimuthDeg?: number;
}): ErrorSeverity;
export declare function calculateNextReviewDate(currentEF?: number, reviewCount?: number, quality?: 0 | 1 | 2 | 3 | 4 | 5): {
    nextReviewDate: Date;
    newEF: number;
    intervalDays: number;
};
export declare function generateMusicalPedagogicalTip(category: AuditoryErrorCategory, correct: IAnswerDetail, userChoice: IAnswerDetail, context?: IQuestionContext): string;
export declare function createWrongAnswer(params: {
    exerciseSlug: ExerciseSlug;
    difficultyLevel: number;
    round: number;
    questionContext: IQuestionContext;
    correctAnswer: IAnswerDetail;
    userAnswer: IAnswerDetail;
    errorCategory: AuditoryErrorCategory;
    severity?: ErrorSeverity;
    responseTimeMs: number;
    sessionId: string;
    userId?: string;
}): IWrongAnswer;
