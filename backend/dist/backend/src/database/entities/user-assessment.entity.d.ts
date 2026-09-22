import { User } from './user.entity';
import { ReadingText } from './reading-text.entity';
export declare class UserAssessment {
    id: string;
    userId: string;
    user: User;
    readingTextId: string;
    readingText: ReadingText;
    readingTimeSec: number;
    rawWpm: number;
    comprehensionScore: number;
    effectiveWpm: number;
    answersJson: Array<{
        questionId: string;
        selectedOption: string;
        isCorrect: boolean;
    }>;
    completedAt: Date;
}
