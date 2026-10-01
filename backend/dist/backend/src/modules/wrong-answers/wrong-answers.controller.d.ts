import { WrongAnswersService } from './wrong-answers.service';
import { AuthService } from '../auth/auth.service';
import { IWrongAnswer, ExerciseSlug } from '@brain-exercises/shared';
export declare class WrongAnswersController {
    private readonly wrongAnswersService;
    private readonly authService;
    constructor(wrongAnswersService: WrongAnswersService, authService: AuthService);
    recordWrongAnswers(body: IWrongAnswer | IWrongAnswer[], authHeader?: string): Promise<{
        success: boolean;
        data: IWrongAnswer[];
    }>;
    getWrongAnswers(exerciseSlug?: string, severity?: string, reviewStatus?: string, limit?: string, offset?: string): {
        success: boolean;
        data: IWrongAnswer[];
        total: number;
    };
    getConfusionStats(exerciseSlug?: ExerciseSlug): {
        success: boolean;
        data: import("@brain-exercises/shared").IConfusionPairStat[];
    };
    updateReview(id: string, body: {
        quality: 0 | 1 | 2 | 3 | 4 | 5;
    }): {
        success: boolean;
        data: IWrongAnswer;
    };
    clearWrongAnswers(exerciseSlug?: string): {
        success: boolean;
        data: {
            clearedCount: number;
        };
    };
}
