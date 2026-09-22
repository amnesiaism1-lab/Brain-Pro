import { User } from './user.entity';
export declare class UserProfile {
    id: string;
    userId: string;
    user: User;
    preferredLanguage: 'vi' | 'en';
    targetWpm: number;
    dailyGoalMinutes: number;
    soundEnabled: boolean;
    theme: 'light' | 'dark' | 'sepia';
    autoDifficultyDefault: boolean;
    updatedAt: Date;
}
