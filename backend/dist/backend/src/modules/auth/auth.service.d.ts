import { JwtService } from '@nestjs/jwt';
import { DataStoreService } from '../../database/data-store.service';
export interface GooglePayload {
    sub: string;
    email: string;
    email_verified: string | boolean;
    name: string;
    picture?: string;
    aud?: string;
}
export declare class AuthService {
    private readonly dataStore;
    private readonly jwtService;
    private readonly googleClientId;
    constructor(dataStore: DataStoreService, jwtService: JwtService);
    verifyGoogleToken(tokenOrCredential: string, isAccessToken?: boolean): Promise<GooglePayload>;
    loginWithGoogle(dto: {
        credential?: string;
        accessToken?: string;
        guestTelemetry?: {
            xp?: number;
            level?: number;
            streak?: number;
            bestStreak?: number;
        };
    }): Promise<{
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
    }>;
    validateToken(token: string): Promise<{
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
    }>;
    syncTelemetry(userId: string, data: {
        xp: number;
        level: number;
        streak: number;
        bestStreak?: number;
    }): Promise<{
        id: any;
        totalXp: any;
        currentLevel: any;
        currentStreak: any;
        bestStreak: any;
    }>;
}
