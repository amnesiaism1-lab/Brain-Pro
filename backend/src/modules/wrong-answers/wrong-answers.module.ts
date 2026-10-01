import { Module } from '@nestjs/common';
import { WrongAnswersController } from './wrong-answers.controller';
import { WrongAnswersService } from './wrong-answers.service';
import { DataStoreService } from '../../database/data-store.service';
import { AuthService } from '../auth/auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'brain-exercises-pro-secret-2026',
      signOptions: { expiresIn: '30d' }
    })
  ],
  controllers: [WrongAnswersController],
  providers: [WrongAnswersService, DataStoreService, AuthService],
  exports: [WrongAnswersService]
})
export class WrongAnswersModule {}
