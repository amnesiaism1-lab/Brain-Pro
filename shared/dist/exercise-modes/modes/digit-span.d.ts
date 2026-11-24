import { IExerciseModeDefinition } from '../types';
export type DigitSpanRecallRule = 'forward' | 'reverse' | 'sort-asc' | 'plus-one';
export type DigitSpanStimulusType = 'digits' | 'letters' | 'alphanumeric' | 'audio';
export type IDigitSpanParams = {
    sequenceLength: number;
    recallRule: DigitSpanRecallRule;
    stimulusType: DigitSpanStimulusType;
    flashPerItemMs: number;
    chunkingGuide: boolean;
};
export declare const DIGIT_SPAN_MODES: IExerciseModeDefinition<IDigitSpanParams>[];
//# sourceMappingURL=digit-span.d.ts.map