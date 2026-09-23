import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { AuthService } from '../auth/auth.service';
import { IGameAttemptRequest, validateRawMetricsJson, MAX_RELATION_EVENTS_PER_ATTEMPT } from '@brain-exercises/shared';

@Controller('attempts')
export class AttemptsController {
  constructor(
    private readonly dataStore: DataStoreService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async recordAttempt(
    @Body() body: IGameAttemptRequest & { userId?: string },
    @Headers('authorization') authHeader?: string
  ) {
    if (body.rawMetricsJson) {
      const val = validateRawMetricsJson(body.rawMetricsJson);
      if (!val.valid) {
        throw new BadRequestException(val.error || `Invalid rawMetricsJson or exceeded limit (${MAX_RELATION_EVENTS_PER_ATTEMPT})`);
      }
    }

    let targetUserId = body.userId;
    if (!targetUserId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const user = await this.authService.validateToken(authHeader.substring(7));
        targetUserId = user?.id;
      } catch {
        // Fallback
      }
    }

    const result = this.dataStore.saveGameAttempt(body, targetUserId);
    return {
      success: true,
      data: result
    };
  }
}

