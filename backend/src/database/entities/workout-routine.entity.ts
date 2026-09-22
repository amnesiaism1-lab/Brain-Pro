import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('workout_routines')
export class WorkoutRoutine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 150 })
  title: string;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ name: 'star_rating', default: 1 })
  starRating: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'items_json', type: 'simple-json' })
  itemsJson: Array<{
    exerciseId: string;
    exerciseSlug: string;
    exerciseTitle: string;
    orderIndex: number;
    recommendedDurationSec: number;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
