"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePrediction = evaluatePrediction;
exports.calculateCrossDomainTransfer = calculateCrossDomainTransfer;
/**
 * Đánh giá kết quả của pha dự đoán trước khi hành động
 */
function evaluatePrediction(query, answer, _resultingState) {
    const isCorrect = answer.selectedOptionId === query.correctOptionId;
    // Sai số dự đoán (Prediction Error):
    // Nếu đúng: error = (1 - confidence) * 0.5 (dù đúng nhưng không tự tin thì vẫn còn chút error)
    // Nếu sai: error = 0.5 + confidence * 0.5 (sai mà càng tự tin thì error càng nghiêm trọng - overconfidence penalty)
    const conf = Math.max(0.2, Math.min(1.0, answer.confidence));
    const predictionError = isCorrect
        ? (1.0 - conf) * 0.4
        : 0.5 + conf * 0.5;
    // Brier Score = (ProbabilityAssigned - ActualOutcome)^2
    // Outcome = 1 if correct, 0 if incorrect
    const actualOutcome = isCorrect ? 1.0 : 0.0;
    const brierCalibrationScore = Math.pow(conf - actualOutcome, 2);
    let feedbackVi = '';
    if (isCorrect && conf >= 0.8) {
        feedbackVi = 'Mô phỏng tư duy xuất sắc! Dự đoán chính xác với độ tự tin vững vàng.';
    }
    else if (isCorrect && conf < 0.8) {
        feedbackVi = 'Dự đoán đúng, nhưng cần tự tin hơn vào mô hình nhận thức của mình.';
    }
    else if (!isCorrect && conf >= 0.8) {
        feedbackVi = 'Cảnh báo tự tin quá mức (Overconfidence): Hệ thống diễn tiến khác với mô hình bạn nhẩm tính.';
    }
    else {
        feedbackVi = 'Chưa dự đoán đúng: Hãy quan sát kỹ vị trí và thuộc tính của các mắt xích liên kết.';
    }
    return {
        isCorrect,
        predictionError: Math.round(predictionError * 100) / 100,
        brierCalibrationScore: Math.round(brierCalibrationScore * 1000) / 1000,
        feedbackVi
    };
}
/**
 * Tính toán khả năng chuyển giao liên miền (Cross-Domain Transfer Ratio)
 */
function calculateCrossDomainTransfer(sourceAccuracy, targetAccuracy, sourceLatencyMs, targetLatencyMs) {
    if (sourceAccuracy <= 0)
        return { transferRatio: 0, isBridgeSuccessful: false };
    const accRatio = Math.min(1.2, targetAccuracy / sourceAccuracy);
    const speedBonus = targetLatencyMs <= sourceLatencyMs * 1.15 ? 1.0 : 0.85;
    const transferRatio = Math.min(1.0, Math.round(accRatio * speedBonus * 100) / 100);
    return {
        transferRatio,
        isBridgeSuccessful: transferRatio >= 0.75
    };
}
