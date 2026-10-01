import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Headers 
} from '@nestjs/common';
import { WrongAnswersService } from './wrong-answers.service';
import { AuthService } from '../auth/auth.service';
import { IWrongAnswer, ExerciseSlug } from '@brain-exercises/shared';

@Controller('wrong-answers')
export class WrongAnswersController {
  constructor(
    private readonly wrongAnswersService: WrongAnswersService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async recordWrongAnswers(
    @Body() body: IWrongAnswer | IWrongAnswer[],
    @Headers('authorization') authHeader?: string
  ) {
    let targetUserId: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const user = await this.authService.validateToken(authHeader.substring(7));
        targetUserId = user?.id;
      } catch {
        // Fallback
      }
    }

    const answers = Array.isArray(body) ? body : [body];
    const saved = this.wrongAnswersService.recordWrongAnswers(answers, targetUserId);

    return {
      success: true,
      data: saved
    };
  }

  @Get()
  getWrongAnswers(
    @Query('exerciseSlug') exerciseSlug?: string,
    @Query('severity') severity?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const result = this.wrongAnswersService.getWrongAnswers({
      exerciseSlug,
      severity,
      reviewStatus,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    return {
      success: true,
      data: result.items,
      total: result.total
    };
  }

  @Get('stats')
  getConfusionStats(
    @Query('exerciseSlug') exerciseSlug?: ExerciseSlug
  ) {
    const stats = this.wrongAnswersService.getConfusionStats(exerciseSlug);
    return {
      success: true,
      data: stats
    };
  }

  @Patch(':id/review')
  updateReview(
    @Param('id') id: string,
    @Body() body: { quality: 0 | 1 | 2 | 3 | 4 | 5 }
  ) {
    const quality = typeof body.quality === 'number' ? body.quality : 3;
    const updated = this.wrongAnswersService.updateReview(id, quality as any);
    return {
      success: Boolean(updated),
      data: updated
    };
  }

  @Delete()
  clearWrongAnswers(
    @Query('exerciseSlug') exerciseSlug?: string
  ) {
    const result = this.wrongAnswersService.clearWrongAnswers(exerciseSlug);
    return {
      success: true,
      data: result
    };
  }
}
