import { DataStoreService } from '../../database/data-store.service';
import { IGameAttemptRequest } from '@brain-exercises/shared';
export declare class AttemptsController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    recordAttempt(body: IGameAttemptRequest): {
        success: boolean;
        data: import("@brain-exercises/shared").IGameAttemptResponse;
    };
}
