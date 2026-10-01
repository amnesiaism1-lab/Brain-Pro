import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('wrong_answers')
@Index(['userId', 'exerciseSlug', 'createdAt'])
@Index(['userId', 'confusionPairKey'])
export class WrongAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'exercise_slug', length: 50 })
  exerciseSlug: string;

  @Column({ name: 'difficulty_level' })
  difficultyLevel: number;

  @Column()
  round: number;

  @Column({ name: 'question_context', type: 'simple-json' })
  questionContext: Record<string, unknown>;

  @Column({ name: 'correct_answer', type: 'simple-json' })
  correctAnswer: Record<string, unknown>;

  @Column({ name: 'user_answer', type: 'simple-json' })
  userAnswer: Record<string, unknown>;

  @Column({ name: 'error_category', length: 40 })
  errorCategory: string;

  @Column({ length: 15 })
  severity: string;

  @Column({ name: 'confusion_pair_key', length: 60 })
  confusionPairKey: string;

  @Column({ name: 'response_time_ms' })
  responseTimeMs: number;

  @Column({ name: 'session_id', length: 60 })
  sessionId: string;

  @Column({ name: 'review_status', length: 20, default: 'new' })
  reviewStatus: string;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'last_reviewed_at', type: 'timestamp', nullable: true })
  lastReviewedAt: Date | null;

  @Column({ name: 'next_review_at', type: 'timestamp', nullable: true })
  nextReviewAt: Date | null;

  @Column({ name: 'ease_factor', type: 'decimal', precision: 3, scale: 2, default: 2.5 })
  easeFactor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
