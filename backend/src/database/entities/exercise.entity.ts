import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ExerciseLevelConfig } from './exercise-level-config.entity';
import { GameAttempt } from './game-attempt.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', length: 50 })
  categoryId: string;

  @Column({ name: 'category_code', length: 50 })
  categoryCode: string;

  @Column({ name: 'category_name', length: 100 })
  categoryName: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 255 })
  subtitle: string;

  @Column({ name: 'icon_name', length: 50 })
  iconName: string;

  @Column({ name: 'scientific_basis', type: 'text' })
  scientificBasis: string;

  @Column({ type: 'text' })
  instructions: string;

  @Column({ name: 'rules_summary', type: 'text' })
  rulesSummary: string;

  @Column({ name: 'max_difficulty_level', default: 8 })
  maxDifficultyLevel: number;

  @Column({ name: 'default_duration_sec', default: 60 })
  defaultDurationSec: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ExerciseLevelConfig, config => config.exercise, { cascade: true })
  levelConfigs: ExerciseLevelConfig[];

  @OneToMany(() => GameAttempt, attempt => attempt.exercise)
  attempts: GameAttempt[];
}
