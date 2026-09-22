import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { GameAttempt } from './game-attempt.entity';
import { UserAssessment } from './user-assessment.entity';
import { DailyStreak } from './daily-streak.entity';
import { UserReminder } from './user-reminder.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'avatar_url', nullable: true, length: 500 })
  avatarUrl: string;

  @Column({ name: 'total_xp', default: 0 })
  totalXp: number;

  @Column({ name: 'current_level', default: 1 })
  currentLevel: number;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'best_streak', default: 0 })
  bestStreak: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserProfile, profile => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => GameAttempt, attempt => attempt.user)
  attempts: GameAttempt[];

  @OneToMany(() => UserAssessment, assessment => assessment.user)
  assessments: UserAssessment[];

  @OneToMany(() => DailyStreak, streak => streak.user)
  streaks: DailyStreak[];

  @OneToMany(() => UserReminder, reminder => reminder.user)
  reminders: UserReminder[];
}
