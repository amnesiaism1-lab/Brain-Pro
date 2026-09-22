import { DataStoreService } from '../../database/data-store.service';
export declare class AnalyticsController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getUserStats(): {
        success: boolean;
        data: import("@brain-exercises/shared").IUserStats;
    };
    getCognitiveRadar(): {
        success: boolean;
        data: import("@brain-exercises/shared").ICognitiveRadar;
    };
}
