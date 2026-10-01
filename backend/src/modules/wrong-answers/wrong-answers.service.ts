import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { IWrongAnswer, ExerciseSlug, IConfusionPairStat } from '@brain-exercises/shared';

@Injectable()
export class WrongAnswersService {
  constructor(private readonly dataStore: DataStoreService) {}

  recordWrongAnswers(answers: IWrongAnswer[], targetUserId?: string): IWrongAnswer[] {
    return this.dataStore.saveWrongAnswers(answers, targetUserId);
  }

  getWrongAnswers(params?: {
    exerciseSlug?: string;
    severity?: string;
    reviewStatus?: string;
    limit?: number;
    offset?: number;
  }): { total: number; items: IWrongAnswer[] } {
    return this.dataStore.getWrongAnswers(params);
  }

  updateReview(id: string, quality: 0 | 1 | 2 | 3 | 4 | 5): IWrongAnswer | null {
    return this.dataStore.updateWrongAnswerReview(id, quality);
  }

  getConfusionStats(exerciseSlug?: ExerciseSlug): IConfusionPairStat[] {
    return this.dataStore.getConfusionPairStats(exerciseSlug);
  }

  clearWrongAnswers(exerciseSlug?: string): { clearedCount: number } {
    return this.dataStore.clearWrongAnswers(exerciseSlug);
  }
}
