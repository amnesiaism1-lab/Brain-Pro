import { Controller, Get, Param } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get()
  getAllExercises() {
    return {
      success: true,
      data: this.dataStore.getExercises()
    };
  }

  @Get(':slug')
  getExerciseBySlug(@Param('slug') slug: string) {
    const exercise = this.dataStore.getExerciseBySlug(slug);
    if (!exercise) {
      return {
        success: false,
        message: `Exercise '${slug}' not found`
      };
    }
    return {
      success: true,
      data: exercise
    };
  }
}
