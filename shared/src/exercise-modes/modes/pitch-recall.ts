import { IExerciseModeDefinition, IParamSchema } from '../types';
import { VOCAL_RECOMMENDED_SCALE_IDS } from '../../music/scales';

const pitchRecallScaleSchema: IParamSchema = {
  version: 1,
  fields: [
    {
      kind: 'enum',
      key: 'scaleSelection',
      labelVi: 'Chọn Âm Giai (Scale)',
      options: [
        { value: 'random', labelVi: 'Ngẫu nhiên trong kho Scale' },
        { value: 'fixed', labelVi: 'Cố định 1 Scale' }
      ],
      default: 'random'
    },
    {
      kind: 'scaleRef',
      key: 'scalePool',
      labelVi: 'Kho Scale ngẫu nhiên',
      multi: true,
      default: VOCAL_RECOMMENDED_SCALE_IDS
    },
    {
      kind: 'scaleRef',
      key: 'scaleId',
      labelVi: 'Âm giai mục tiêu',
      multi: false,
      default: 'major'
    },
    {
      kind: 'number',
      key: 'sequenceLength',
      labelVi: 'Độ dài chuỗi nốt',
      min: 3,
      max: 8,
      step: 1,
      unit: 'nốt',
      default: 4
    },
    {
      kind: 'number',
      key: 'noteSpeedMs',
      labelVi: 'Tốc độ phát nốt',
      min: 250,
      max: 1000,
      step: 50,
      unit: 'ms',
      default: 550
    },
    {
      kind: 'boolean',
      key: 'visualKeyHint',
      labelVi: 'Hiển thị phím sáng gợi ý',
      default: false
    }
  ],
  visibleWhen: {
    scalePool: { field: 'scaleSelection', equals: 'random' },
    scaleId: { field: 'scaleSelection', equals: 'fixed' }
  }
};

const pitchRecallSequenceSchema: IParamSchema = {
  version: 1,
  fields: [
    {
      kind: 'number',
      key: 'sequenceLength',
      labelVi: 'Độ dài chuỗi nốt',
      min: 2,
      max: 9,
      step: 1,
      unit: 'nốt',
      default: 4
    },
    {
      kind: 'number',
      key: 'keyCount',
      labelVi: 'Số phím hiển thị trên đàn',
      min: 5,
      max: 21,
      step: 1,
      unit: 'phím',
      default: 8
    },
    {
      kind: 'boolean',
      key: 'accidentals',
      labelVi: 'Bao gồm nốt thăng/giáng (phím đen)',
      default: false
    },
    {
      kind: 'boolean',
      key: 'reverseRecall',
      labelVi: 'Đảo ngược chuỗi (Bấm từ nốt cuối về nốt đầu)',
      default: false
    },
    {
      kind: 'number',
      key: 'noteSpeedMs',
      labelVi: 'Tốc độ phát nốt',
      min: 250,
      max: 1000,
      step: 50,
      unit: 'ms',
      default: 550
    }
  ]
};

export const PITCH_RECALL_MODES: IExerciseModeDefinition[] = [
  {
    id: 'pitch-recall.scale-degree',
    exerciseSlug: 'pitch-recall',
    labelVi: 'Cảm Âm Theo Bậc Scale',
    descriptionVi: 'Lắng nghe các nốt nằm trong âm giai (Scale) và bấm lại chính xác trên phím đàn',
    status: 'stable',
    schema: pitchRecallScaleSchema,
    builtInPresets: [
      {
        id: 'pr-scale-random',
        labelVi: '🎲 Ngẫu Nhiên Scale',
        params: { scaleSelection: 'random', sequenceLength: 4, noteSpeedMs: 500 }
      },
      {
        id: 'pr-scale-pentatonic',
        labelVi: '🎵 Ngũ Cung Thính Giác',
        params: { scaleSelection: 'fixed', scaleId: 'major pentatonic', sequenceLength: 5, noteSpeedMs: 450 }
      }
    ]
  },
  {
    id: 'pitch-recall.sequence',
    exerciseSlug: 'pitch-recall',
    labelVi: 'Chuỗi Cao Độ Thuận (Tiêu chuẩn)',
    descriptionVi: 'Ghi nhớ chuỗi nốt ngẫu nhiên và bấm lại theo đúng thứ tự',
    status: 'stable',
    schema: pitchRecallSequenceSchema
  },
  {
    id: 'pitch-recall.reverse',
    exerciseSlug: 'pitch-recall',
    labelVi: 'Đảo Ngược Chuỗi Âm (Reverse Recall)',
    descriptionVi: 'Bấm ngược lại chuỗi nốt từ sau ra trước',
    status: 'stable',
    schema: pitchRecallSequenceSchema
  }
];
