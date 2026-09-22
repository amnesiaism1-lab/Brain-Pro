import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('daily_streaks')
@Unique(['userId', 'streakDate'])
export class DailyStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.streaks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'streak_date', type: 'date' })
  streakDate: string;

  @Column({ name: 'minutes_trained', default: 0 })
  minutesTrained: number;

  @Column({ name: 'exercises_completed', default: 0 })
  exercisesCompleted: number;

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;
}
