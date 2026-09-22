import { ReadingQuestion } from './reading-question.entity';
export declare class ReadingText {
    id: string;
    title: string;
    category: string;
    wordCount: number;
    difficultyLevel: number;
    content: string;
    previewExcerpt: string;
    author: string;
    createdAt: Date;
    questions: ReadingQuestion[];
}
