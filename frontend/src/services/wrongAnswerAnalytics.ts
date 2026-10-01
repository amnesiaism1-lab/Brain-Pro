import { 
  AuditoryErrorCategory, 
  ErrorSeverity, 
  ExerciseSlug, 
  IAnswerDetail, 
  IConfusionPairStat, 
  IWrongAnswer, 
  IReviewRecommendation, 
  IAuditoryProgressSnapshot,
  generateConfusionPairKey,
  calculateErrorSeverity 
} from '@brain-exercises/shared';

/**
 * Tự động phân loại lỗi thính giác dựa trên bài tập và câu trả lời
 */
export function classifyAuditoryError(
  slug: ExerciseSlug,
  correct: IAnswerDetail,
  userChoice: IAnswerDetail
): { category: AuditoryErrorCategory; severity: ErrorSeverity } {
  switch (slug) {
    case 'interval-identify': {
      const deltaSemitones = Math.abs((correct.semitones ?? 0) - (userChoice.semitones ?? 0));
      return {
        category: 'INTERVAL_CONFUSION',
        severity: calculateErrorSeverity('INTERVAL_CONFUSION', { semitones: deltaSemitones })
      };
    }

    case 'chord-identify': {
      // Nhầm giữa Trưởng (Major) và Thứ (Minor) là lỗi tinh chỉnh (minor severity)
      const isTriadShift = (correct.code === 'Major' && userChoice.code === 'Minor') ||
                           (correct.code === 'Minor' && userChoice.code === 'Major');
      return {
        category: 'CHORD_MISIDENTIFY',
        severity: isTriadShift ? 'minor' : 'moderate'
      };
    }

    case 'pitch-recall': {
      const semitoneOffset = (correct.semitones !== undefined && userChoice.semitones !== undefined)
        ? Math.abs(correct.semitones - userChoice.semitones)
        : 1;
      return {
        category: 'PITCH_DRIFT',
        severity: calculateErrorSeverity('PITCH_DRIFT', { semitones: semitoneOffset })
      };
    }

    case 'timbre-match': {
      return {
        category: 'TIMBRE_CONFUSION',
        severity: calculateErrorSeverity('TIMBRE_CONFUSION')
      };
    }

    case 'rhythm-recall': {
      const timingDelta = userChoice.timingDeltaMs ? Math.abs(userChoice.timingDeltaMs) : undefined;
      const isTiming = timingDelta !== undefined && timingDelta > 0;
      return {
        category: isTiming ? 'RHYTHM_TIMING_ERROR' : 'RHYTHM_PATTERN_ERROR',
        severity: calculateErrorSeverity(isTiming ? 'RHYTHM_TIMING_ERROR' : 'RHYTHM_PATTERN_ERROR', {
          timingMs: timingDelta
        })
      };
    }

    case 'sound-localization': {
      const degDiff = (correct.azimuthDeg !== undefined && userChoice.azimuthDeg !== undefined)
        ? Math.abs(correct.azimuthDeg - userChoice.azimuthDeg)
        : 45;
      return {
        category: 'SPATIAL_DIRECTION_ERROR',
        severity: calculateErrorSeverity('SPATIAL_DIRECTION_ERROR', { azimuthDeg: degDiff })
      };
    }

    case 'vocal-pitch-match': {
      const cents = userChoice.centsDeviation ? Math.abs(userChoice.centsDeviation) : 35;
      return {
        category: 'VOCAL_INTONATION_ERROR',
        severity: calculateErrorSeverity('VOCAL_INTONATION_ERROR', { cents })
      };
    }

    default:
      return {
        category: 'INTERVAL_CONFUSION',
        severity: 'moderate'
      };
  }
}

/**
 * Tính toán ma trận nhầm lẫn tổng hợp từ danh sách câu sai
 */
export function calculateConfusionMatrix(
  wrongAnswers: IWrongAnswer[],
  slug?: ExerciseSlug | 'ALL'
): IConfusionPairStat[] {
  const targetItems = slug && slug !== 'ALL'
    ? wrongAnswers.filter(a => a.exerciseSlug === slug)
    : wrongAnswers;

  const pairMap = new Map<string, {
    pairKey: string;
    exerciseSlug: ExerciseSlug;
    labelA: string;
    labelB: string;
    codeA: string;
    codeB: string;
    totalErrors: number;
    recentErrors: number;
    totalResponseMs: number;
    lastOccurredAt: string;
    masteredCount: number;
  }>();

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const item of targetItems) {
    const key = item.confusionPairKey || generateConfusionPairKey(item.correctAnswer.code, item.userAnswer.code);
    if (!pairMap.has(key)) {
      pairMap.set(key, {
        pairKey: key,
        exerciseSlug: item.exerciseSlug,
        labelA: item.correctAnswer.label,
        labelB: item.userAnswer.label,
        codeA: item.correctAnswer.code,
        codeB: item.userAnswer.code,
        totalErrors: 0,
        recentErrors: 0,
        totalResponseMs: 0,
        lastOccurredAt: item.timestamp,
        masteredCount: 0
      });
    }

    const stat = pairMap.get(key)!;
    stat.totalErrors += 1;
    stat.totalResponseMs += item.responseTimeMs || 0;
    if (new Date(item.timestamp).getTime() >= sevenDaysAgo) {
      stat.recentErrors += 1;
    }
    if (item.reviewStatus === 'mastered') {
      stat.masteredCount += 1;
    }
    if (new Date(item.timestamp).getTime() > new Date(stat.lastOccurredAt).getTime()) {
      stat.lastOccurredAt = item.timestamp;
    }
  }

  const result: IConfusionPairStat[] = [];
  pairMap.forEach(s => {
    const avgMs = s.totalErrors > 0 ? Math.round(s.totalResponseMs / s.totalErrors) : 0;
    const isMastered = s.masteredCount >= 2 && s.recentErrors === 0;

    result.push({
      pairKey: s.pairKey,
      exerciseSlug: s.exerciseSlug,
      labelA: s.labelA,
      labelB: s.labelB,
      codeA: s.codeA,
      codeB: s.codeB,
      totalErrors: s.totalErrors,
      recentErrors: s.recentErrors,
      avgResponseMs: avgMs,
      masteredAt: isMastered ? s.lastOccurredAt : null,
      trendDirection: s.recentErrors === 0 ? 'improving' : s.recentErrors >= 3 ? 'declining' : 'stagnant',
      lastOccurredAt: s.lastOccurredAt
    });
  });

  return result.sort((a, b) => b.totalErrors - a.totalErrors);
}

/**
 * Chuẩn hóa tên nhãn hiển thị cho cặp nhầm lẫn, loại bỏ tiền tố dài dòng (Chuỗi đúng, Bạn chọn, v.v.)
 */
export function formatConfusionPairDisplay(stat: IConfusionPairStat): { title: string; cleanA: string; cleanB: string } {
  const sanitize = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^(Chuỗi đúng|Bạn chọn|Nốt mục tiêu|Nốt hát được|Mẫu chuẩn)\s*:\s*/i, '')
      .trim();
  };

  const rawA = sanitize(stat.labelA) || stat.codeA || '';
  const rawB = sanitize(stat.labelB) || stat.codeB || '';

  // Kiểm tra nếu mã nốt nhạc là nốt đơn (ví dụ: F4, G#4, Bb3, C5)
  const isPitchNote = (code: string) => /^[A-G][b#]?[0-9]$/.test(code);
  if (stat.codeA && stat.codeB && isPitchNote(stat.codeA) && isPitchNote(stat.codeB)) {
    return {
      title: `Phân biệt Nốt ${stat.codeA} ↔ Nốt ${stat.codeB}`,
      cleanA: `Nốt ${stat.codeA}`,
      cleanB: `Nốt ${stat.codeB}`
    };
  }

  // Rút gọn nếu chuỗi quá dài (ví dụ chuỗi nhiều nốt)
  const cleanA = rawA.length > 25 ? rawA.slice(0, 22) + '...' : rawA;
  const cleanB = rawB.length > 25 ? rawB.slice(0, 22) + '...' : rawB;

  return {
    title: `Phân biệt ${cleanA} ↔ ${cleanB}`,
    cleanA,
    cleanB
  };
}

/**
 * Đề xuất ôn tập thông minh dựa trên độ lặp lại và tính cấp bách
 */
export function generateReviewRecommendations(
  stats: IConfusionPairStat[],
  wrongAnswers: IWrongAnswer[]
): IReviewRecommendation[] {
  const recommendations: IReviewRecommendation[] = [];

  for (const s of stats) {
    if (s.masteredAt) continue; // Đã nắm vững thì bỏ qua

    const { title, cleanA, cleanB } = formatConfusionPairDisplay(s);

    let urgency: 'high' | 'medium' | 'low' = 'low';
    let reason = '';

    if (s.recentErrors >= 4 || s.totalErrors >= 6) {
      urgency = 'high';
      reason = `Bạn đã nhầm lẫn giữa ${cleanA} và ${cleanB} ${s.recentErrors > 0 ? `${s.recentErrors} lần trong 7 ngày qua` : `${s.totalErrors} lần`}. Cần ôn tập ngay để tránh hình thành thói quen nghe sai.`;
    } else if (s.recentErrors >= 2 || s.totalErrors >= 3) {
      urgency = 'medium';
      reason = `Ghi nhận ${s.totalErrors} lần nhầm giữa ${cleanA} và ${cleanB}. Nên củng cố để phân biệt sắc thái vi tế.`;
    } else {
      urgency = 'low';
      reason = `Lỗi mới xuất hiện gần đây giữa ${cleanA} và ${cleanB} (${s.totalErrors} lần). Ôn lại 3-5 phút để tăng phản xạ.`;
    }

    // Tìm ví dụ câu sai mẫu gần nhất để trích ngữ cảnh
    const sample = wrongAnswers.find(w => w.confusionPairKey === s.pairKey);

    recommendations.push({
      id: `rec-${s.exerciseSlug}-${s.pairKey}`,
      exerciseSlug: s.exerciseSlug,
      confusionPairKey: s.pairKey,
      title,
      urgency,
      reason,
      suggestedLevel: sample?.difficultyLevel || 3,
      estimatedReviewMinutes: urgency === 'high' ? 7 : urgency === 'medium' ? 5 : 3,
      totalWrongCount: s.totalErrors,
      exampleQuestionContext: sample?.questionContext
    });
  }

  // Sắp xếp ưu tiên: high -> medium -> low
  const urgencyWeight = { high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);
}

/**
 * Tổng hợp snapshot tiến bộ theo dòng thời gian (theo ngày)
 */
export function calculateProgressTimeline(
  wrongAnswers: IWrongAnswer[],
  days: number = 14
): IAuditoryProgressSnapshot[] {
  const result: IAuditoryProgressSnapshot[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dayItems = wrongAnswers.filter(a => a.timestamp.startsWith(dateStr));
    const wrongCount = dayItems.length;
    // Giả định mẫu ước lượng câu đúng dựa trên số câu sai trong ngày (tối thiểu 10 câu nếu có chơi)
    const estimatedTotal = wrongCount > 0 ? Math.max(wrongCount * 3, 10) : 0;
    const accuracyRate = estimatedTotal > 0
      ? Math.round(((estimatedTotal - wrongCount) / estimatedTotal) * 100)
      : 100;

    const avgResponseMs = wrongCount > 0
      ? Math.round(dayItems.reduce((acc, cur) => acc + (cur.responseTimeMs || 0), 0) / wrongCount)
      : 0;

    const avgLevel = wrongCount > 0
      ? Math.round(dayItems.reduce((acc, cur) => acc + cur.difficultyLevel, 0) / wrongCount)
      : 1;

    result.push({
      date: dateStr,
      exerciseSlug: dayItems[0]?.exerciseSlug || 'interval-identify',
      totalQuestions: estimatedTotal,
      wrongCount,
      accuracyRate,
      topConfusionPairs: calculateConfusionMatrix(dayItems).slice(0, 3),
      avgResponseMs,
      levelAtTime: avgLevel
    });
  }

  return result;
}
