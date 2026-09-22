import { DataStoreService } from '../../database/data-store.service';
import { IUserAssessmentRequest } from '@brain-exercises/shared';
export declare class ReadingAssessmentController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getReadingTexts(): {
        success: boolean;
        data: import("@brain-exercises/shared").IReadingText[];
    };
    getReadingTextById(id: string): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@brain-exercises/shared").IReadingText;
        message?: undefined;
    };
    submitAssessment(body: IUserAssessmentRequest): {
        success: boolean;
        data: import("@brain-exercises/shared").IUserAssessmentResponse;
    };
}
