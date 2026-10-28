import { ExerciseSlug } from '../../types';
import { IExerciseModeDefinition, IParamSchema } from '../types';

const genericDefaultSchema: IParamSchema = {
  version: 1,
  fields: []
};

export function createDefaultExerciseMode(slug: ExerciseSlug): IExerciseModeDefinition {
  return {
    id: `${slug}.standard`,
    exerciseSlug: slug,
    labelVi: 'Chế Độ Tùy Chỉnh Tiêu Chuẩn',
    descriptionVi: 'Tùy chỉnh số lượt vòng tập và thời gian giới hạn theo nhu cầu cá nhân',
    status: 'stable',
    schema: genericDefaultSchema
  };
}
