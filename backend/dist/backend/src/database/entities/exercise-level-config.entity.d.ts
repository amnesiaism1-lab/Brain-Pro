import { Exercise } from './exercise.entity';
export declare class ExerciseLevelConfig {
    id: string;
    exerciseId: string;
    exercise: Exercise;
    level: number;
    gridRows: number;
    gridCols: number;
    targetItemCount: number;
    timeLimitSec: number;
    speedWpm: number;
    parametersJson: Record<string, unknown>;
}
