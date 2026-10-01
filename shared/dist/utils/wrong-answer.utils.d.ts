import { AuditoryErrorCategory, ErrorSeverity, IAnswerDetail, IQuestionContext, IWrongAnswer, ExerciseSlug } from '../types';
/**
 * Sinh khóa cặp nhầm lẫn (luôn sắp xếp bảng chữ cái để 3m:3M và 3M:3m là 1 cặp duy nhất)
 */
export declare function generateConfusionPairKey(codeA: string, codeB: string): string;
/**
 * Tính mức độ nghiêm trọng của lỗi thính giác dựa trên danh mục và độ lệch
 */
export declare function calculateErrorSeverity(category: AuditoryErrorCategory, delta?: {
    semitones?: number;
    cents?: number;
    timingMs?: number;
    azimuthDeg?: number;
}): ErrorSeverity;
/**
 * Thuật toán SM-2 (SuperMemo 2) Spaced Repetition tính ngày ôn tiếp theo
 * quality: 0 (hoàn toàn quên/sai) đến 5 (nhận diện tức thì chính xác)
 */
export declare function calculateNextReviewDate(currentEF?: number, reviewCount?: number, quality?: 0 | 1 | 2 | 3 | 4 | 5): {
    nextReviewDate: Date;
    newEF: number;
    intervalDays: number;
};
/**
 * Sinh giải thích âm nhạc sư phạm dựa trên câu đúng vs câu sai
 */
export declare function generateMusicalPedagogicalTip(category: AuditoryErrorCategory, correct: IAnswerDetail, userChoice: IAnswerDetail, context?: IQuestionContext): string;
/**
 * Factory tạo đối tượng IWrongAnswer chuẩn hóa
 */
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
//# sourceMappingURL=wrong-answer.utils.d.ts.map