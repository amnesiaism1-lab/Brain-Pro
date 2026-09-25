import { IRdePredictionAnswer, IRdePredictionQuery, IRdeBoardState } from './types';
export interface IPredictionEvaluation {
    isCorrect: boolean;
    predictionError: number;
    brierCalibrationScore: number;
    feedbackVi: string;
}
export declare function evaluatePrediction(query: IRdePredictionQuery, answer: IRdePredictionAnswer, _resultingState?: IRdeBoardState): IPredictionEvaluation;
export declare function calculateCrossDomainTransfer(sourceAccuracy: number, targetAccuracy: number, sourceLatencyMs: number, targetLatencyMs: number): {
    transferRatio: number;
    isBridgeSuccessful: boolean;
};
