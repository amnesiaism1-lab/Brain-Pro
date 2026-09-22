import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ReadingText } from './reading-text.entity';

@Entity('user_assessments')
export class UserAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'reading_text_id' })
  readingTextId: string;

  @ManyToOne(() => ReadingText, text => text.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reading_text_id' })
  readingText: ReadingText;

  @Column({ name: 'reading_time_sec', type: 'decimal', precision: 7, scale: 2 })
  readingTimeSec: number;

  @Column({ name: 'raw_wpm' })
  rawWpm: number;

  @Column({ name: 'comprehension_score', type: 'decimal', precision: 5, scale: 2 })
  comprehensionScore: number;

  @Column({ name: 'effective_wpm' })
  effectiveWpm: number;

  @Column({ name: 'answers_json', type: 'simple-json' })
  answersJson: Array<{ questionId: string; selectedOption: string; isCorrect: boolean }>;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;
}
