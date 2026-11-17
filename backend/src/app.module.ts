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
import { WrongAnswersController } from './modules/wrong-answers/wrong-answers.controller';
import { WrongAnswersService } from './modules/wrong-answers/wrong-answers.service';
import { VocalStudioController } from './modules/vocal-studio/vocal-studio.controller';
import { VocalStudioService } from './modules/vocal-studio/vocal-studio.service';
import { getJwtSecret } from './common/jwt-config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '30d' }
      })
    })
  ],
  controllers: [
    ExercisesController,
    AttemptsController,
    WorkoutsController,
    ReadingAssessmentController,
    AnalyticsController,
    RemindersController,
    AuthController,
    WrongAnswersController,
    VocalStudioController
  ],
  providers: [DataStoreService, AuthService, WrongAnswersService, VocalStudioService],
  exports: [DataStoreService, AuthService, WrongAnswersService, VocalStudioService]
})
export class AppModule {}
