import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DataStoreService } from './database/data-store.service';
import { ExercisesController } from './modules/exercises/exercises.controller';
import { AttemptsController } from './modules/attempts/attempts.controller';
import { WorkoutsController } from './modules/workouts/workouts.controller';
import { ReadingAssessmentController } from './modules/reading-assessment/reading-assessment.controller';
import { AnalyticsController } from './modules/analytics/analytics.controller';
import { RemindersController } from './modules/reminders/reminders.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'brain-exercises-pro-secret-2026',
      signOptions: { expiresIn: '30d' }
    })
  ],
  controllers: [
    ExercisesController,
    AttemptsController,
    WorkoutsController,
    ReadingAssessmentController,
    AnalyticsController,
    RemindersController,
    AuthController
  ],
  providers: [DataStoreService, AuthService],
  exports: [DataStoreService, AuthService]
})
export class AppModule {}
