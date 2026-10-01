import { DataStoreService } from '../../database/data-store.service';
import { IWrongAnswer, ExerciseSlug, IConfusionPairStat } from '@brain-exercises/shared';
export declare class WrongAnswersService {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    recordWrongAnswers(answers: IWrongAnswer[], targetUserId?: string): IWrongAnswer[];
    getWrongAnswers(params?: {
        exerciseSlug?: string;
        severity?: string;
        reviewStatus?: string;
        limit?: number;
        offset?: number;
    }): {
        total: number;
        items: IWrongAnswer[];
    };
    updateReview(id: string, quality: 0 | 1 | 2 | 3 | 4 | 5): IWrongAnswer | null;
    getConfusionStats(exerciseSlug?: ExerciseSlug): IConfusionPairStat[];
    clearWrongAnswers(exerciseSlug?: string): {
        clearedCount: number;
    };
}
