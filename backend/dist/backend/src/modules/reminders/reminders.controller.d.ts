import { DataStoreService } from '../../database/data-store.service';
import { IUserReminder } from '@brain-exercises/shared';
export declare class RemindersController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getReminders(): {
        success: boolean;
        data: IUserReminder[];
    };
    updateReminders(body: {
        reminders: IUserReminder[];
    }): {
        success: boolean;
        data: IUserReminder[];
    };
}
