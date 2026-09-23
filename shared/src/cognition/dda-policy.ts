import { RelationId } from './relations';
import { IRelationshipMastery } from './mastery';
import { ExerciseSlug } from '../types';
import { EXERCISE_RELATION_MAP } from './exercise-relation-map';

export interface ICognitiveDdaResult {
  recommendedLevel: number;
  reason: string;
  scaffoldActive: boolean;
  interferenceActive: boolean;
  relationStrengths: {
    primaryRelation: RelationId;
    primaryAccuracy: number;
    primaryTier: number;
    isBottleneck: boolean;
  };
}

export function evaluateCognitiveDda(
  exerciseSlug: ExerciseSlug,
  currentLevel: number,
  accuracyRate: number,
  timeSpentSec: number,
  timeLimitSec: number,
  masteries: Record<RelationId, IRelationshipMastery>
): ICognitiveDdaResult {
  const mapping = EXERCISE_RELATION_MAP[exerciseSlug];
  const primaryId = mapping ? mapping.primaryRelation : 'TARGET_POSITION';
  const primaryMastery = masteries[primaryId];
  const primaryAcc = primaryMastery ? primaryMastery.accuracy : accuracyRate / 100;
  const primaryTier = primaryMastery ? primaryMastery.currentTier : 1;

  let nextLevel = currentLevel;
  let reason = 'Duy trì cấp độ hiện tại để tích lũy độ vững.';
  let scaffoldActive = false;
  let interferenceActive = false;
  let isBottleneck = false;

  const isFast = timeSpentSec <= timeLimitSec * 0.75;
  const isTimeout = timeSpentSec >= timeLimitSec;

  if (accuracyRate >= 90 && isFast && primaryAcc >= 0.85) {
    nextLevel = Math.min(22, currentLevel + 1);
    reason = `Làm chủ tốt quan hệ chính (${primaryId}), sẵn sàng nâng độ khó.`;
    if (primaryTier >= 3) {
      interferenceActive = true;
    }
  } else if (accuracyRate < 60 || isTimeout) {
    if (primaryAcc < 0.65 && primaryMastery && primaryMastery.exposureCount >= 30) {
      nextLevel = Math.max(1, currentLevel - 1);
      reason = `Quan hệ nhận thức (${primaryId}) cần hạ áp lực để tái củng cố.`;
      isBottleneck = true;
    } else {
      scaffoldActive = true;
      reason = `Giữ nguyên cấp độ, tăng cường điểm tựa thị giác để vượt qua nút thắt.`;
    }
  } else {
    reason = `Độ chính xác đạt chuẩn (${accuracyRate}%). Tiếp tục rèn luyện để tăng độ ổn định.`;
  }

  return {
    recommendedLevel: nextLevel,
    reason,
    scaffoldActive,
    interferenceActive,
    relationStrengths: {
      primaryRelation: primaryId,
      primaryAccuracy: Math.round(primaryAcc * 100),
      primaryTier,
      isBottleneck
    }
  };
}
