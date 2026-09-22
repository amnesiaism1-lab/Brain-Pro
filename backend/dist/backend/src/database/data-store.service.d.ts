import { OnModuleInit } from '@nestjs/common';
import { IExercise, IWorkoutRoutine, IReadingText, IGameAttemptRequest, IGameAttemptResponse, IUserAssessmentRequest, IUserAssessmentResponse, IUserStats, IUserReminder } from '@brain-exercises/shared';
export declare class DataStoreService implements OnModuleInit {
    private exercises;
    private routines;
    private readingTexts;
    private attempts;
    private assessments;
    private reminders;
    private currentUser;
    onModuleInit(): void;
    getExercises(): IExercise[];
    getExerciseBySlug(slug: string): IExercise | undefined;
    getRoutines(): IWorkoutRoutine[];
    getRoutineByCode(code: string): IWorkoutRoutine | undefined;
    getReadingTexts(): IReadingText[];
    getReadingTextById(id: string): IReadingText | undefined;
    saveGameAttempt(attemptDto: IGameAttemptRequest): IGameAttemptResponse;
    saveAssessment(dto: IUserAssessmentRequest): IUserAssessmentResponse;
    getUserStats(): IUserStats;
    getCurrentUser(): {
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
    getReminders(): IUserReminder[];
    updateReminders(reminders: IUserReminder[]): IUserReminder[];
}
