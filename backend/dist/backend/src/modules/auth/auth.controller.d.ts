import { DataStoreService } from '../../database/data-store.service';
export declare class AuthController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getCurrentUser(): {
        success: boolean;
        data: {
            id: string;
            email: string;
            username: string;
            totalXp: number;
            currentLevel: number;
            currentStreak: number;
            bestStreak: number;
            profile: {
                id: string;
                userId: string;
                preferredLanguage: "vi";
                targetWpm: number;
                dailyGoalMinutes: number;
                soundEnabled: boolean;
                theme: "light";
                autoDifficultyDefault: boolean;
            };
        };
    };
    login(body: {
        email: string;
    }): {
        success: boolean;
        data: {
            token: string;
            user: {
                email: string;
                id: string;
                username: string;
                totalXp: number;
                currentLevel: number;
                currentStreak: number;
                bestStreak: number;
                profile: {
                    id: string;
                    userId: string;
                    preferredLanguage: "vi";
                    targetWpm: number;
                    dailyGoalMinutes: number;
                    soundEnabled: boolean;
                    theme: "light";
                    autoDifficultyDefault: boolean;
                };
            };
        };
    };
    register(body: {
        email: string;
        username: string;
    }): {
        success: boolean;
        data: {
            token: string;
            user: {
                email: string;
                username: string;
                id: string;
                totalXp: number;
                currentLevel: number;
                currentStreak: number;
                bestStreak: number;
                profile: {
                    id: string;
                    userId: string;
                    preferredLanguage: "vi";
                    targetWpm: number;
                    dailyGoalMinutes: number;
                    soundEnabled: boolean;
                    theme: "light";
                    autoDifficultyDefault: boolean;
                };
            };
        };
    };
}
