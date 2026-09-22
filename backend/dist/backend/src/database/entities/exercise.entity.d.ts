import { ExerciseLevelConfig } from './exercise-level-config.entity';
import { GameAttempt } from './game-attempt.entity';
export declare class Exercise {
    id: string;
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    slug: string;
    title: string;
    subtitle: string;
    iconName: string;
    scientificBasis: string;
    instructions: string;
    rulesSummary: string;
    maxDifficultyLevel: number;
    defaultDurationSec: number;
    isFeatured: boolean;
    createdAt: Date;
    levelConfigs: ExerciseLevelConfig[];
    attempts: GameAttempt[];
}
