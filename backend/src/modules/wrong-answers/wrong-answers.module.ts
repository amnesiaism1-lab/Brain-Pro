import { Module } from '@nestjs/common';
import { WrongAnswersController } from './wrong-answers.controller';
import { WrongAnswersService } from './wrong-answers.service';
import { DataStoreService } from '../../database/data-store.service';
import { AuthService } from '../auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret } from '../../common/jwt-config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '30d' }
      })
    })
  ],
  controllers: [WrongAnswersController],
  providers: [WrongAnswersService, DataStoreService, AuthService],
  exports: [WrongAnswersService]
})
export class WrongAnswersModule {}
