import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ReadingQuestion } from './reading-question.entity';

@Entity('reading_texts')
export class ReadingText {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 100 })
  category: string;

  @Column({ name: 'word_count' })
  wordCount: number;

  @Column({ name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'preview_excerpt', length: 500 })
  previewExcerpt: string;

  @Column({ length: 150 })
  author: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ReadingQuestion, question => question.readingText, { cascade: true })
  questions: ReadingQuestion[];
}
