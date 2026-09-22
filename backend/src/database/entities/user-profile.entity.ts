import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, user => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'preferred_language', length: 10, default: 'vi' })
  preferredLanguage: 'vi' | 'en';

  @Column({ name: 'target_wpm', default: 450 })
  targetWpm: number;

  @Column({ name: 'daily_goal_minutes', default: 15 })
  dailyGoalMinutes: number;

  @Column({ name: 'sound_enabled', default: true })
  soundEnabled: boolean;

  @Column({ length: 20, default: 'light' })
  theme: 'light' | 'dark' | 'sepia';

  @Column({ name: 'auto_difficulty_default', default: true })
  autoDifficultyDefault: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
