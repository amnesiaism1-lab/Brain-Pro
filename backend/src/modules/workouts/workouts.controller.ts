import { Controller, Get, Param } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get()
  getAllRoutines() {
    return {
      success: true,
      data: this.dataStore.getRoutines()
    };
  }

  @Get(':code')
  getRoutineByCode(@Param('code') code: string) {
    const routine = this.dataStore.getRoutineByCode(code);
    if (!routine) {
      return {
        success: false,
        message: `Workout routine '${code}' not found`
      };
    }
    return {
      success: true,
      data: routine
    };
  }
}
