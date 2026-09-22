import { User } from './user.entity';
export declare class DailyStreak {
    id: string;
    userId: string;
    user: User;
    streakDate: string;
    minutesTrained: number;
    exercisesCompleted: number;
    xpEarned: number;
}
