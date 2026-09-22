import { ReadingText } from './reading-text.entity';
export declare class ReadingQuestion {
    id: string;
    readingTextId: string;
    readingText: ReadingText;
    questionOrder: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    explanation: string;
}
