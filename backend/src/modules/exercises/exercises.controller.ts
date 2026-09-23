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

  @Get('word-search/vocabulary')
  getWordSearchVocabulary() {
    const textWords = this.dataStore.getReadingTexts().flatMap(t => t.content.split(/\s+/));
    const cleanWords = Array.from(new Set(
      textWords
        .map(w => w.replace(/[^a-zA-ZÀ-ỹ0-9]/g, '').toUpperCase())
        .filter(w => w.length >= 3 && w.length <= 8)
    ));
    return {
      success: true,
      data: cleanWords
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
