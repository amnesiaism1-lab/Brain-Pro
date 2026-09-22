import { Controller, Get } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get('stats')
  getUserStats() {
    return {
      success: true,
      data: this.dataStore.getUserStats()
    };
  }

  @Get('radar')
  getCognitiveRadar() {
    const stats = this.dataStore.getUserStats();
    return {
      success: true,
      data: stats.radar
    };
  }
}
