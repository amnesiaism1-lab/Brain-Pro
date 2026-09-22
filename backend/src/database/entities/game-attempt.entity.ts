import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Exercise } from './exercise.entity';

@Entity('game_attempts')
@Index(['userId', 'createdAt'])
export class GameAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @ManyToOne(() => Exercise, exercise => exercise.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column({ name: 'exercise_slug', length: 100 })
  exerciseSlug: string;

  @Column({ name: 'difficulty_level' })
  difficultyLevel: number;

  @Column()
  score: number;

  @Column({ name: 'accuracy_rate', type: 'decimal', precision: 5, scale: 2 })
  accuracyRate: number;

  @Column({ name: 'time_spent_sec', type: 'decimal', precision: 7, scale: 2 })
  timeSpentSec: number;

  @Column({ name: 'effective_wpm', nullable: true })
  effectiveWpm: number;

  @Column({ name: 'raw_metrics_json', type: 'simple-json', nullable: true })
  rawMetricsJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
