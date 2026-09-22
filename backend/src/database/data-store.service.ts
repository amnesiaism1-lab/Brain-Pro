import { Injectable, OnModuleInit } from '@nestjs/common';
import { 
  EXERCISES_METADATA, 
  WORKOUT_ROUTINES, 
  SAMPLE_READING_TEXTS 
} from '@brain-exercises/shared';
import { 
  IExercise, 
  IWorkoutRoutine, 
  IReadingText, 
  IGameAttemptRequest, 
  IGameAttemptResponse,
  IUserAssessmentRequest,
  IUserAssessmentResponse,
  IUserStats,
  IUserReminder
} from '@brain-exercises/shared';
import { 
  calculateRecommendedNextLevel,
  calculateEffectiveWpm,
  calculateWpm
} from '@brain-exercises/shared';

@Injectable()
export class DataStoreService implements OnModuleInit {
  private exercises: IExercise[] = [];
  private routines: IWorkoutRoutine[] = [];
  private readingTexts: IReadingText[] = [];
  private attempts: Array<IGameAttemptRequest & { id: string; userId: string; createdAt: Date }> = [];
  private assessments: Array<IUserAssessmentResponse & { id: string; userId: string; readingTextId: string; createdAt: Date }> = [];
  private reminders: IUserReminder[] = [
    {
      id: 'rem-1',
      reminderTime: '08:30',
      daysOfWeek: [1, 2, 3, 4, 5],
      isEnabled: true,
      label: 'Luyện tập buổi sáng 15 phút'
    }
  ];

  private currentUser = {
    id: 'user-demo-1',
    email: 'user@brainexercises.pro',
    username: 'BrainMaster',
    totalXp: 350,
    currentLevel: 2,
    currentStreak: 4,
    bestStreak: 7,
    profile: {
      id: 'prof-demo-1',
      userId: 'user-demo-1',
      preferredLanguage: 'vi' as const,
      targetWpm: 500,
      dailyGoalMinutes: 15,
      soundEnabled: true,
      theme: 'light' as const,
      autoDifficultyDefault: true
    }
  };

  onModuleInit() {
    this.exercises = JSON.parse(JSON.stringify(EXERCISES_METADATA));
    this.routines = JSON.parse(JSON.stringify(WORKOUT_ROUTINES));
    this.readingTexts = JSON.parse(JSON.stringify(SAMPLE_READING_TEXTS));
  }

  getExercises(): IExercise[] {
    return this.exercises;
  }

  getExerciseBySlug(slug: string): IExercise | undefined {
    return this.exercises.find(e => e.slug === slug);
  }

  getRoutines(): IWorkoutRoutine[] {
    return this.routines;
  }

  getRoutineByCode(code: string): IWorkoutRoutine | undefined {
    return this.routines.find(r => r.code === code);
  }

  getReadingTexts(): IReadingText[] {
    return this.readingTexts;
  }

  getReadingTextById(id: string): IReadingText | undefined {
    return this.readingTexts.find(t => t.id === id);
  }

  saveGameAttempt(attemptDto: IGameAttemptRequest): IGameAttemptResponse {
    const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.attempts.push({
      ...attemptDto,
      id,
      userId: this.currentUser.id,
      createdAt: new Date()
    });

    const xpEarned = Math.round(attemptDto.score / 10) + (attemptDto.accuracyRate >= 80 ? 25 : 10);
    this.currentUser.totalXp += xpEarned;
    this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;

    const timeLimit = 60;
    const nextLevel = calculateRecommendedNextLevel(
      attemptDto.difficultyLevel,
      attemptDto.accuracyRate,
      attemptDto.timeSpentSec,
      timeLimit
    );

    return {
      id,
      score: attemptDto.score,
      xpEarned,
      currentLevel: this.currentUser.currentLevel,
      totalXp: this.currentUser.totalXp,
      currentStreak: this.currentUser.currentStreak,
      recommendedNextLevel: nextLevel,
      isNewHighScore: true,
      message: `Tuyệt vời! Bạn đã nhận được +${xpEarned} XP rèn luyện nhận thức.`
    };
  }

  saveAssessment(dto: IUserAssessmentRequest): IUserAssessmentResponse {
    const text = this.getReadingTextById(dto.readingTextId);
    if (!text) {
      throw new Error('Reading text not found');
    }

    const rawWpm = calculateWpm(text.wordCount, dto.readingTimeSec);
    let correctCount = 0;
    const questions = text.questions || [];

    dto.answers.forEach(ans => {
      const q = questions.find(item => item.id === ans.questionId);
      if (q && q.correctOption === ans.selectedOption) {
        correctCount++;
      }
    });

    const totalQuestions = Math.max(1, questions.length);
    const comprehensionScore = Math.round((correctCount / totalQuestions) * 100);
    const effectiveWpm = calculateEffectiveWpm(rawWpm, comprehensionScore);
    const id = `assess-${Date.now()}`;
    const xpEarned = Math.round(effectiveWpm / 5) + (comprehensionScore >= 75 ? 50 : 20);

    this.currentUser.totalXp += xpEarned;
    this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;

    const res: IUserAssessmentResponse = {
      id,
      rawWpm,
      comprehensionScore,
      effectiveWpm,
      correctAnswersCount: correctCount,
      totalQuestionsCount: totalQuestions,
      feedback: effectiveWpm >= 500 
        ? 'Tốc độ đọc xuất chúng! Bạn đã đạt trình độ đọc siêu nhanh với mức thấu hiểu cao.'
        : effectiveWpm >= 300 
          ? 'Tốc độ rất tốt! Tiếp tục rèn luyện Bảng Schulte và RSVP để khử đọc thầm hoàn toàn.'
          : 'Khởi đầu tốt! Hãy tập trung vào việc đọc cụm từ thay vì đọc từng chữ đơn lẻ.',
      xpEarned
    };

    this.assessments.push({
      ...res,
      userId: this.currentUser.id,
      readingTextId: dto.readingTextId,
      createdAt: new Date()
    });

    return res;
  }

  getUserStats(): IUserStats {
    const totalMinutes = Math.round(
      this.attempts.reduce((sum, a) => sum + (a.timeSpentSec || 0), 0) / 60
    ) + 24;

    return {
      totalXp: this.currentUser.totalXp,
      currentLevel: this.currentUser.currentLevel,
      currentStreak: this.currentUser.currentStreak,
      bestStreak: this.currentUser.bestStreak,
      totalSessions: this.attempts.length + 5,
      totalMinutesTrained: totalMinutes,
      averageWpm: 420,
      radar: {
        speedReadingScore: 78,
        peripheralVisionScore: 85,
        memoryScore: 72,
        attentionScore: 90,
        reactionScore: 82
      }
    };
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getReminders(): IUserReminder[] {
    return this.reminders;
  }

  updateReminders(reminders: IUserReminder[]): IUserReminder[] {
    this.reminders = reminders;
    return this.reminders;
  }
}
