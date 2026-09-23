import { RelationId } from './relations';
import { ExerciseSlug } from '../types';

export interface ICognitiveWorkoutChain {
  id: string;
  title: string;
  description: string;
  focusRelations: RelationId[];
  targetDurationMinutes: number;
  steps: {
    order: number;
    exerciseSlug: ExerciseSlug;
    durationSec: number;
    relationObjective: string;
  }[];
}

export const COGNITIVE_RELATION_CHAINS: ICognitiveWorkoutChain[] = [
  {
    id: 'chain-position-sequence',
    title: 'Chuỗi Định Vị Không Gian & Chuỗi Thứ Tự',
    description: 'Chuyển giao năng lực định vị từ bảng số phẳng sang chuỗi nhớ vị trí động.',
    focusRelations: ['TARGET_POSITION', 'ORDER_SEQUENCE', 'SPATIAL_TRANSFORM'],
    targetDurationMinutes: 12,
    steps: [
      {
        order: 1,
        exerciseSlug: 'schulte-table',
        durationSec: 120,
        relationObjective: 'Khởi động định vị mục tiêu trong không gian 2 chiều.'
      },
      {
        order: 2,
        exerciseSlug: 'spatial-memory',
        durationSec: 180,
        relationObjective: 'Chuyển giao sang ghi nhớ và tái hiện chuỗi vị trí trong không gian.'
      },
      {
        order: 3,
        exerciseSlug: 'digit-span',
        durationSec: 180,
        relationObjective: 'Củng cố chuỗi thứ tự âm vị học và nhớ ngược.'
      }
    ]
  },
  {
    id: 'chain-inhibition-control',
    title: 'Chuỗi Kiểm Soát Ức Chế & Chuyển Đổi Luật',
    description: 'Tập trung ức chế phản xạ thói quen và thích ứng thần tốc với các tín hiệu nghịch chiều.',
    focusRelations: ['INHIBITION', 'RULE_ACTION', 'TARGET_DISTRACTOR'],
    targetDurationMinutes: 10,
    steps: [
      {
        order: 1,
        exerciseSlug: 'stroop-clash',
        durationSec: 150,
        relationObjective: 'Ức chế can thiệp giữa nhận diện màu mực và đọc chữ.'
      },
      {
        order: 2,
        exerciseSlug: 'even-odd',
        durationSec: 150,
        relationObjective: 'Chuyển đổi quy tắc phân loại và phản xạ đảo chiều.'
      },
      {
        order: 3,
        exerciseSlug: 'find-letter',
        durationSec: 150,
        relationObjective: 'Lọc nhiễu thị giác và ức chế các ký tự tương đồng.'
      }
    ]
  },
  {
    id: 'chain-lexical-prediction',
    title: 'Chuỗi Ngôn Ngữ, Gom Cụm & Dự Đoán Nhịp',
    description: 'Nâng cao khả năng tiếp nhận từ tố, đọc theo khối ý nghĩa và thấu suốt văn bản.',
    focusRelations: ['PART_WHOLE', 'TEMPORAL_PREDICT', 'CONTEXT_MEANING'],
    targetDurationMinutes: 15,
    steps: [
      {
        order: 1,
        exerciseSlug: 'anagram',
        durationSec: 180,
        relationObjective: 'Tái tổ hợp linh hoạt các ký tự thành từ vựng có nghĩa.'
      },
      {
        order: 2,
        exerciseSlug: 'word-chunking',
        durationSec: 240,
        relationObjective: 'Tập nhảy nhãn cầu theo từng khối ngữ pháp 2-4 từ.'
      },
      {
        order: 3,
        exerciseSlug: 'rsvp-speed-reader',
        durationSec: 240,
        relationObjective: 'Đón nhận dòng từ nối tiếp tốc độ cao tại điểm nhận diện tối ưu.'
      },
      {
        order: 4,
        exerciseSlug: 'reading-assessment',
        durationSec: 240,
        relationObjective: 'Thấu hiểu văn bản thực chiến và đo lường Effective WPM.'
      }
    ]
  }
];
