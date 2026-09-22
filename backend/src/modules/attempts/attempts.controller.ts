import { Controller, Post, Body } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { IGameAttemptRequest } from '@brain-exercises/shared';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Post()
  recordAttempt(@Body() body: IGameAttemptRequest) {
    const result = this.dataStore.saveGameAttempt(body);
    return {
      success: true,
      data: result
    };
  }
}
