import { User } from './user.entity';
export declare class UserReminder {
    id: string;
    userId: string;
    user: User;
    reminderTime: string;
    daysOfWeek: number[];
    isEnabled: boolean;
    label: string;
    createdAt: Date;
}
