import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  ExerciseSlug, 
  IAnswerDetail, 
  IQuestionContext, 
  IWrongAnswer,
  createWrongAnswer,
  AuditoryErrorCategory,
  ErrorSeverity 
} from '@brain-exercises/shared';
import { classifyAuditoryError } from '../services/wrongAnswerAnalytics';

export interface ITrackWrongAnswerParams {
  round: number;
  difficultyLevel: number;
  questionContext: IQuestionContext;
  correctAnswer: IAnswerDetail;
  userAnswer: IAnswerDetail;
  responseTimeMs: number;
  sessionId: string;
  errorCategory?: AuditoryErrorCategory;
  severity?: ErrorSeverity;
}

/**
 * Hook thống nhất để 7 game bài tập cảm âm & thính giác ghi nhận câu làm sai.
 * Tự động phân loại danh mục lỗi, tính mức độ nghiêm trọng, tạo cặp nhầm lẫn,
 * lưu vào Store/LocalStorage, và giữ trọn tương thích ngược với earConfusionMatrix.
 */
export function useWrongAnswerTracker(exerciseSlug: ExerciseSlug) {
  const recordWrongAnswer = useAppStore(s => s.recordWrongAnswer);
  const recordEarConfusion = useAppStore(s => s.recordEarConfusion);
  const authUser = useAppStore(s => s.authUser);

  const trackWrongAnswer = useCallback((params: ITrackWrongAnswerParams): IWrongAnswer => {
    // 1. Phân loại lỗi tự động nếu chưa có
    const autoClassified = classifyAuditoryError(
      exerciseSlug,
      params.correctAnswer,
      params.userAnswer
    );

    const errorCategory = params.errorCategory || autoClassified.category;
    const severity = params.severity || autoClassified.severity;

    // 2. Tạo đối tượng IWrongAnswer chuẩn hóa
    const wrongAnswer = createWrongAnswer({
      exerciseSlug,
      difficultyLevel: params.difficultyLevel,
      round: params.round,
      questionContext: params.questionContext,
      correctAnswer: params.correctAnswer,
      userAnswer: params.userAnswer,
      errorCategory,
      severity,
      responseTimeMs: params.responseTimeMs,
      sessionId: params.sessionId,
      userId: authUser?.id
    });

    // 3. Ghi vào Zustand store (tự động persist vào localStorage + sync backend)
    recordWrongAnswer(wrongAnswer);

    // 4. Giữ tương thích ngược với hệ thống earConfusionMatrix cũ
    if (wrongAnswer.confusionPairKey) {
      recordEarConfusion(wrongAnswer.confusionPairKey);
    }

    return wrongAnswer;
  }, [exerciseSlug, recordWrongAnswer, recordEarConfusion, authUser?.id]);

  return { trackWrongAnswer };
}
