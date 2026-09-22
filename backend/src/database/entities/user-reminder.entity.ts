import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_reminders')
export class UserReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'reminder_time', length: 5, default: '08:00' })
  reminderTime: string; // HH:mm

  @Column({ name: 'days_of_week_json', type: 'simple-json' })
  daysOfWeek: number[]; // [0, 1, 2, 3, 4, 5, 6]

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ length: 100, default: 'Đến giờ luyện não mỗi ngày!' })
  label: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
