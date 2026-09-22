import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { IUserAssessmentRequest } from '@brain-exercises/shared';

@Controller('reading-assessments')
export class ReadingAssessmentController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get('texts')
  getReadingTexts() {
    return {
      success: true,
      data: this.dataStore.getReadingTexts()
    };
  }

  @Get('texts/:id')
  getReadingTextById(@Param('id') id: string) {
    const text = this.dataStore.getReadingTextById(id);
    if (!text) {
      return {
        success: false,
        message: 'Reading text not found'
      };
    }
    return {
      success: true,
      data: text
    };
  }

  @Post('submit')
  submitAssessment(@Body() body: IUserAssessmentRequest) {
    const result = this.dataStore.saveAssessment(body);
    return {
      success: true,
      data: result
    };
  }
}
