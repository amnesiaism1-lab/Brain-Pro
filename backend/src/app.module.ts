import { Module } from '@nestjs/common';
import { DataStoreService } from './database/data-store.service';
import { ExercisesController } from './modules/exercises/exercises.controller';
import { AttemptsController } from './modules/attempts/attempts.controller';
import { WorkoutsController } from './modules/workouts/workouts.controller';
import { ReadingAssessmentController } from './modules/reading-assessment/reading-assessment.controller';
import { AnalyticsController } from './modules/analytics/analytics.controller';
import { RemindersController } from './modules/reminders/reminders.controller';
import { AuthController } from './modules/auth/auth.controller';

@Module({
  imports: [],
  controllers: [
    ExercisesController,
    AttemptsController,
    WorkoutsController,
    ReadingAssessmentController,
    AnalyticsController,
    RemindersController,
    AuthController
  ],
  providers: [DataStoreService],
  exports: [DataStoreService]
})
export class AppModule {}
