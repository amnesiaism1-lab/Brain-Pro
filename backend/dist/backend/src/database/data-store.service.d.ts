import { OnModuleInit } from '@nestjs/common';
import { RelationId, IRelationshipMastery } from '@brain-exercises/shared';
import { IExercise, IWorkoutRoutine, IReadingText, IGameAttemptRequest, IGameAttemptResponse, IUserAssessmentRequest, IUserAssessmentResponse, IUserStats, IUserReminder } from '@brain-exercises/shared';
export declare class DataStoreService implements OnModuleInit {
    private exercises;
    private routines;
    private readingTexts;
    private attempts;
    private assessments;
    private relationMasteries;
    private reminders;
    private currentUser;
    private pgPool;
    private isSupabaseConnected;
    onModuleInit(): Promise<void>;
    private syncUserFromDatabase;
    getExercises(): IExercise[];
    getExerciseBySlug(slug: string): IExercise | undefined;
    getRoutines(): IWorkoutRoutine[];
    getRoutineByCode(code: string): IWorkoutRoutine | undefined;
    getReadingTexts(): IReadingText[];
    getReadingTextById(id: string): IReadingText | undefined;
    saveGameAttempt(attemptDto: IGameAttemptRequest): IGameAttemptResponse;
    private persistAttemptToSupabase;
    saveAssessment(dto: IUserAssessmentRequest): IUserAssessmentResponse;
    getUserStats(): IUserStats;
    getRelationshipMasteries(): Record<RelationId, IRelationshipMastery>;
    getBrainGraph(): {
        nodes: {
            id: RelationId;
            nameVi: string;
            nameEn: string;
            iconName: string;
            masteryScore: number;
            tier: 1 | 2 | 3 | 4;
            exposureCount: number;
            stability: number;
            transferScore: number;
            representativeGames: string[];
        }[];
        edges: {
            source: string;
            target: string;
            relation: string;
        }[];
        overallTrainingIndex: number;
    };
    recommendCognitiveChain(): {
        bottleneckRelation: RelationId;
        relationDef: import("@brain-exercises/shared").ICognitiveRelationDef;
        recommendedChain: import("@brain-exercises/shared").ICognitiveWorkoutChain;
    };
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
