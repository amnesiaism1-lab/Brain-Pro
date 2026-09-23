import { DataStoreService } from '../../database/data-store.service';
import { AuthService } from '../auth/auth.service';
import { IGameAttemptRequest } from '@brain-exercises/shared';
export declare class AttemptsController {
    private readonly dataStore;
    private readonly authService;
    constructor(dataStore: DataStoreService, authService: AuthService);
    recordAttempt(body: IGameAttemptRequest & {
        userId?: string;
    }, authHeader?: string): Promise<{
        success: boolean;
        data: import("@brain-exercises/shared").IGameAttemptResponse;
    }>;
}
