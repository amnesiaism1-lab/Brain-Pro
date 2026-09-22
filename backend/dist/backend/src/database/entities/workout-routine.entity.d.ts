export declare class WorkoutRoutine {
    id: string;
    code: string;
    title: string;
    durationMinutes: number;
    starRating: number;
    description: string;
    isDefault: boolean;
    itemsJson: Array<{
        exerciseId: string;
        exerciseSlug: string;
        exerciseTitle: string;
        orderIndex: number;
        recommendedDurationSec: number;
    }>;
    createdAt: Date;
}
