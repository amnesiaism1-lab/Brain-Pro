import { IRdePredictionAnswer, IRdePredictionQuery, IRdeBoardState } from './types';
export interface IPredictionEvaluation {
    isCorrect: boolean;
    predictionError: number;
    brierCalibrationScore: number;
    feedbackVi: string;
}
/**
 * Đánh giá kết quả của pha dự đoán trước khi hành động
 */
export declare function evaluatePrediction(query: IRdePredictionQuery, answer: IRdePredictionAnswer, _resultingState?: IRdeBoardState): IPredictionEvaluation;
/**
 * Tính toán khả năng chuyển giao liên miền (Cross-Domain Transfer Ratio)
 */
export declare function calculateCrossDomainTransfer(sourceAccuracy: number, targetAccuracy: number, sourceLatencyMs: number, targetLatencyMs: number): {
    transferRatio: number;
    isBridgeSuccessful: boolean;
};
//# sourceMappingURL=prediction-metric.d.ts.map