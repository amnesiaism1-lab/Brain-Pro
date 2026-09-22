import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ReadingText } from './reading-text.entity';

@Entity('reading_questions')
export class ReadingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reading_text_id' })
  readingTextId: string;

  @ManyToOne(() => ReadingText, text => text.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reading_text_id' })
  readingText: ReadingText;

  @Column({ name: 'question_order' })
  questionOrder: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'option_a', length: 255 })
  optionA: string;

  @Column({ name: 'option_b', length: 255 })
  optionB: string;

  @Column({ name: 'option_c', length: 255 })
  optionC: string;

  @Column({ name: 'option_d', length: 255 })
  optionD: string;

  @Column({ name: 'correct_option', length: 1 })
  correctOption: 'A' | 'B' | 'C' | 'D';

  @Column({ type: 'text', nullable: true })
  explanation: string;
}
