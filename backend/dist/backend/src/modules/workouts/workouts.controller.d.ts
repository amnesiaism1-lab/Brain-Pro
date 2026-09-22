import { DataStoreService } from '../../database/data-store.service';
export declare class WorkoutsController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getAllRoutines(): {
        success: boolean;
        data: import("@brain-exercises/shared").IWorkoutRoutine[];
    };
    getRoutineByCode(code: string): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@brain-exercises/shared").IWorkoutRoutine;
        message?: undefined;
    };
}
