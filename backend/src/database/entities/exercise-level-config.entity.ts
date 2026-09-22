import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Exercise } from './exercise.entity';

@Entity('exercise_level_configs')
export class ExerciseLevelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @ManyToOne(() => Exercise, exercise => exercise.levelConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column()
  level: number;

  @Column({ name: 'grid_rows', nullable: true })
  gridRows: number;

  @Column({ name: 'grid_cols', nullable: true })
  gridCols: number;

  @Column({ name: 'target_item_count', nullable: true })
  targetItemCount: number;

  @Column({ name: 'time_limit_sec' })
  timeLimitSec: number;

  @Column({ name: 'speed_wpm', nullable: true })
  speedWpm: number;

  @Column({ name: 'parameters_json', type: 'simple-json', nullable: true })
  parametersJson: Record<string, unknown>;
}
