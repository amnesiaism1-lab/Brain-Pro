import { UserProfile } from './user-profile.entity';
import { GameAttempt } from './game-attempt.entity';
import { UserAssessment } from './user-assessment.entity';
import { DailyStreak } from './daily-streak.entity';
import { UserReminder } from './user-reminder.entity';
export declare class User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    avatarUrl: string;
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    bestStreak: number;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile;
    attempts: GameAttempt[];
    assessments: UserAssessment[];
    streaks: DailyStreak[];
    reminders: UserReminder[];
}
