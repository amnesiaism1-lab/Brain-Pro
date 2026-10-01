"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConfusionPairKey = generateConfusionPairKey;
exports.calculateErrorSeverity = calculateErrorSeverity;
exports.calculateNextReviewDate = calculateNextReviewDate;
exports.generateMusicalPedagogicalTip = generateMusicalPedagogicalTip;
exports.createWrongAnswer = createWrongAnswer;
/**
 * Sinh khóa cặp nhầm lẫn (luôn sắp xếp bảng chữ cái để 3m:3M và 3M:3m là 1 cặp duy nhất)
 */
function generateConfusionPairKey(codeA, codeB) {
    const cleanA = (codeA || 'unknown').trim();
    const cleanB = (codeB || 'unknown').trim();
    return [cleanA, cleanB].sort().join(':');
}
/**
 * Tính mức độ nghiêm trọng của lỗi thính giác dựa trên danh mục và độ lệch
 */
function calculateErrorSeverity(category, delta) {
    switch (category) {
        case 'INTERVAL_CONFUSION': {
            const s = Math.abs(delta?.semitones ?? 1);
            if (s <= 1)
                return 'minor'; // Nhầm m3 vs M3 (1 bán âm) là lỗi tinh chỉnh
            if (s <= 3)
                return 'moderate'; // Lệch 2-3 bán âm
            return 'critical'; // Lệch rất xa (>3 bán âm)
        }
        case 'CHORD_MISIDENTIFY': {
            // Major vs Minor là minor; Triad vs Dim7 hoặc 9th là moderate/critical
            const s = Math.abs(delta?.semitones ?? 1);
            return s <= 1 ? 'minor' : s <= 2 ? 'moderate' : 'critical';
        }
        case 'PITCH_DRIFT': {
            const s = Math.abs(delta?.semitones ?? 1);
            if (s <= 1)
                return 'minor'; // Lệch 1 nửa cung (C4 -> C#4)
            if (s <= 2)
                return 'moderate'; // Lệch 1 cung
            return 'critical';
        }
        case 'VOCAL_INTONATION_ERROR': {
            const cents = Math.abs(delta?.cents ?? 30);
            if (cents <= 35)
                return 'minor';
            if (cents <= 70)
                return 'moderate';
            return 'critical';
        }
        case 'RHYTHM_TIMING_ERROR': {
            const ms = Math.abs(delta?.timingMs ?? 100);
            if (ms <= 120)
                return 'minor';
            if (ms <= 250)
                return 'moderate';
            return 'critical';
        }
        case 'SPATIAL_DIRECTION_ERROR': {
            const deg = Math.abs(delta?.azimuthDeg ?? 45);
            if (deg <= 45)
                return 'minor';
            if (deg <= 90)
                return 'moderate';
            return 'critical';
        }
        case 'TIMBRE_CONFUSION':
        case 'RHYTHM_PATTERN_ERROR':
        default:
            return 'moderate';
    }
}
/**
 * Thuật toán SM-2 (SuperMemo 2) Spaced Repetition tính ngày ôn tiếp theo
 * quality: 0 (hoàn toàn quên/sai) đến 5 (nhận diện tức thì chính xác)
 */
function calculateNextReviewDate(currentEF = 2.5, reviewCount = 0, quality = 3) {
    // Công thức cập nhật Ease Factor SM-2:
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3)
        newEF = 1.3;
    newEF = Math.round(newEF * 100) / 100;
    let intervalDays;
    if (quality < 3) {
        // Trả lời sai hoặc khó khăn -> reset khoảng cách về 1 ngày
        intervalDays = 1;
    }
    else if (reviewCount === 0) {
        intervalDays = 1;
    }
    else if (reviewCount === 1) {
        intervalDays = 6;
    }
    else {
        intervalDays = Math.max(1, Math.round(reviewCount * newEF));
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return {
        nextReviewDate: nextDate,
        newEF,
        intervalDays
    };
}
/**
 * Sinh giải thích âm nhạc sư phạm dựa trên câu đúng vs câu sai
 */
function generateMusicalPedagogicalTip(category, correct, userChoice, context) {
    switch (category) {
        case 'INTERVAL_CONFUSION': {
            const cSemi = correct.semitones ?? 0;
            const uSemi = userChoice.semitones ?? 0;
            const diff = uSemi - cSemi;
            const diffText = diff > 0
                ? `cao hơn ${diff} bán âm`
                : `thấp hơn ${Math.abs(diff)} bán âm`;
            return `Đáp án đúng là ${correct.label} (${cSemi} bán âm). Bạn đã chọn ${userChoice.label} (${uSemi} bán âm), lệch ${diffText}. Mẹo: Hãy liên tưởng âm hưởng cảm xúc đặc trưng (quãng thứ buồn/tối, quãng trưởng sáng/vui).`;
        }
        case 'CHORD_MISIDENTIFY': {
            return `Hợp âm chuẩn là ${correct.label}. Bạn đã chọn ${userChoice.label}. Mẹo: Hãy chú ý nghe nốt bậc 3 (xác định Trưởng/Thứ) và nốt bậc 7 để bắt trọn màu sắc hòa âm.`;
        }
        case 'PITCH_DRIFT': {
            return `Nốt chuẩn là ${correct.label}. Bạn đã chọn ${userChoice.label}. Hãy dùng Tonic Drone (âm bè chủ âm) để làm mốc neo thính giác định vị nốt.`;
        }
        case 'TIMBRE_CONFUSION': {
            return `Âm sắc đúng là ${correct.label}. Dạng sóng này có phổ hài âm riêng biệt. Hãy lắng nghe độ sắc bén (sawtooth), ấm áp (sine) hay rỗng (square).`;
        }
        case 'RHYTHM_TIMING_ERROR':
        case 'RHYTHM_PATTERN_ERROR': {
            const delta = userChoice.timingDeltaMs ? `${Math.abs(userChoice.timingDeltaMs)}ms` : '';
            return `Nhịp điệu bị lệch ${delta}. Hãy đếm thầm nhịp nhỏ (subdivision: 1 và 2 và) trong đầu để gõ chuẩn xác hơn.`;
        }
        case 'SPATIAL_DIRECTION_ERROR': {
            return `Hướng âm thanh đúng là ${correct.label} (${correct.azimuthDeg ?? 0}°). Hãy chú ý độ trễ giữa hai tai (ITD) và chênh lệch âm lượng (ILD) qua tai nghe stereo.`;
        }
        case 'VOCAL_INTONATION_ERROR': {
            const cents = userChoice.centsDeviation ? `${Math.abs(userChoice.centsDeviation)} cents` : '';
            const dir = (userChoice.centsDeviation ?? 0) > 0 ? 'cao hơn nốt' : 'non/thấp hơn nốt';
            return `Giọng bạn bị ${dir} ${cents}. Hãy hạ bớt áp lực hơi, mở rộng vòm họng và lắng nghe nốt gốc trước khi ngân giọng.`;
        }
        default:
            return `Đáp án đúng: ${correct.label} — Lựa chọn của bạn: ${userChoice.label}.`;
    }
}
/**
 * Factory tạo đối tượng IWrongAnswer chuẩn hóa
 */
function createWrongAnswer(params) {
    const confusionPairKey = generateConfusionPairKey(params.correctAnswer.code, params.userAnswer.code);
    const semitoneDelta = (params.correctAnswer.semitones !== undefined && params.userAnswer.semitones !== undefined)
        ? Math.abs(params.correctAnswer.semitones - params.userAnswer.semitones)
        : undefined;
    const severity = params.severity || calculateErrorSeverity(params.errorCategory, {
        semitones: semitoneDelta,
        cents: params.userAnswer.centsDeviation,
        timingMs: params.userAnswer.timingDeltaMs,
        azimuthDeg: (params.correctAnswer.azimuthDeg !== undefined && params.userAnswer.azimuthDeg !== undefined)
            ? Math.abs(params.correctAnswer.azimuthDeg - params.userAnswer.azimuthDeg)
            : undefined
    });
    const nowIso = new Date().toISOString();
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1); // SRS default 1 day
    // Tự động bổ sung giải thích sư phạm nếu chưa có
    const enhancedCorrect = { ...params.correctAnswer };
    if (!enhancedCorrect.explanationVi) {
        enhancedCorrect.explanationVi = generateMusicalPedagogicalTip(params.errorCategory, params.correctAnswer, params.userAnswer, params.questionContext);
    }
    // Tạo UUID đơn giản
    const id = `wa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return {
        id,
        userId: params.userId,
        exerciseSlug: params.exerciseSlug,
        difficultyLevel: params.difficultyLevel,
        round: params.round,
        questionContext: params.questionContext,
        correctAnswer: enhancedCorrect,
        userAnswer: params.userAnswer,
        errorCategory: params.errorCategory,
        severity,
        confusionPairKey,
        responseTimeMs: params.responseTimeMs,
        timestamp: nowIso,
        sessionId: params.sessionId,
        reviewStatus: 'new',
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewAt: nextReview.toISOString(),
        easeFactor: 2.5,
        consecutiveCorrectInReview: 0
    };
}
