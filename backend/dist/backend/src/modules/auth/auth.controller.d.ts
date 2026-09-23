import { AuthService } from './auth.service';
import { DataStoreService } from '../../database/data-store.service';
export declare class AuthController {
    private readonly authService;
    private readonly dataStore;
    constructor(authService: AuthService, dataStore: DataStoreService);
    loginWithGoogle(body: {
        credential?: string;
        accessToken?: string;
        guestTelemetry?: {
            xp?: number;
            level?: number;
            streak?: number;
            bestStreak?: number;
        };
    }): Promise<{
        success: boolean;
        data: {
            token: string;
            user: {
                id: any;
                email: any;
                username: any;
                avatarUrl: any;
                totalXp: any;
                currentLevel: any;
                currentStreak: any;
                bestStreak: any;
                authProvider: string;
                createdAt: any;
            };
            message: string;
        };
    }>;
    getCurrentUser(authHeader?: string): Promise<{
        success: boolean;
        data: {
            id: any;
            email: any;
            username: any;
            avatarUrl: any;
            totalXp: any;
            currentLevel: any;
            currentStreak: any;
            bestStreak: any;
            authProvider: any;
            createdAt: any;
        };
    } | {
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
    }>;
    syncTelemetry(authHeader: string | undefined, body: {
        xp: number;
        level: number;
        streak: number;
        bestStreak?: number;
    }): Promise<{
        success: boolean;
        data: {
            id: any;
            totalXp: any;
            currentLevel: any;
            currentStreak: any;
            bestStreak: any;
        };
    }>;
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
    logout(): {
        success: boolean;
        message: string;
    };
}
