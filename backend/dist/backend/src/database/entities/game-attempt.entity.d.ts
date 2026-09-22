import { User } from './user.entity';
import { Exercise } from './exercise.entity';
export declare class GameAttempt {
    id: string;
    userId: string;
    user: User;
    exerciseId: string;
    exercise: Exercise;
    exerciseSlug: string;
    difficultyLevel: number;
    score: number;
    accuracyRate: number;
    timeSpentSec: number;
    effectiveWpm: number;
    rawMetricsJson: Record<string, unknown>;
    createdAt: Date;
}
