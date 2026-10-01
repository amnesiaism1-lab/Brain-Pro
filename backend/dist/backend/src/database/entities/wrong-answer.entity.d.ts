import { User } from './user.entity';
export declare class WrongAnswer {
    id: string;
    userId: string;
    user: User;
    exerciseSlug: string;
    difficultyLevel: number;
    round: number;
    questionContext: Record<string, unknown>;
    correctAnswer: Record<string, unknown>;
    userAnswer: Record<string, unknown>;
    errorCategory: string;
    severity: string;
    confusionPairKey: string;
    responseTimeMs: number;
    sessionId: string;
    reviewStatus: string;
    reviewCount: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    easeFactor: number;
    createdAt: Date;
}
