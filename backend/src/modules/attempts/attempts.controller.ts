import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { IGameAttemptRequest, validateRawMetricsJson, MAX_RELATION_EVENTS_PER_ATTEMPT } from '@brain-exercises/shared';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Post()
  recordAttempt(@Body() body: IGameAttemptRequest) {
    if (body.rawMetricsJson) {
      const val = validateRawMetricsJson(body.rawMetricsJson);
      if (!val.valid) {
        throw new BadRequestException(val.error || `Invalid rawMetricsJson or exceeded limit (${MAX_RELATION_EVENTS_PER_ATTEMPT})`);
      }
    }

    const result = this.dataStore.saveGameAttempt(body);
    return {
      success: true,
      data: result
    };
  }
}

