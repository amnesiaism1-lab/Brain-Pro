import { DataStoreService } from '../../database/data-store.service';
export declare class ExercisesController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getAllExercises(): {
        success: boolean;
        data: import("@brain-exercises/shared").IExercise[];
    };
    getWordSearchVocabulary(): {
        success: boolean;
        data: string[];
    };
    getExerciseBySlug(slug: string): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@brain-exercises/shared").IExercise;
        message?: undefined;
    };
}
