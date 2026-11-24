import { IExerciseModeDefinition, IParamSchema } from '../types';

export type DigitSpanRecallRule = 'forward' | 'reverse' | 'sort-asc' | 'plus-one';
export type DigitSpanStimulusType = 'digits' | 'letters' | 'alphanumeric' | 'audio';

export type IDigitSpanParams = {
  sequenceLength: number;
  recallRule: DigitSpanRecallRule;
  stimulusType: DigitSpanStimulusType;
  flashPerItemMs: number;
  chunkingGuide: boolean;
};

const digitSpanSchema: IParamSchema = {
  version: 1,
  fields: [
    {
      kind: 'number',
      key: 'sequenceLength',
      labelVi: 'Độ dài chuỗi ghi nhớ',
      descriptionVi: 'Số lượng chữ số / ký tự cần ghi nhớ trong mỗi lượt',
      min: 3,
      max: 14,
      step: 1,
      unit: 'ký tự',
      default: 6
    },
    {
      kind: 'enum',
      key: 'recallRule',
      labelVi: 'Quy tắc tái hiện trí nhớ',
      descriptionVi: 'Chế độ biến đổi chuỗi trước khi nhập đáp án',
      options: [
        { value: 'forward', labelVi: 'Xuôi chiều (Giữ nguyên thứ tự)' },
        { value: 'reverse', labelVi: 'Đảo ngược (Nhập từ cuối về đầu)' },
        { value: 'sort-asc', labelVi: 'Sắp xếp tăng dần (0 → 9)' },
        { value: 'plus-one', labelVi: 'Cộng nhẩm +1 từng số (9 → 0)' }
      ],
      default: 'forward'
    },
    {
      kind: 'enum',
      key: 'stimulusType',
      labelVi: 'Loại tín hiệu kích thích',
      options: [
        { value: 'digits', labelVi: 'Chữ số (0–9)' },
        { value: 'letters', labelVi: 'Chữ cái Latin (A–Z)' },
        { value: 'alphanumeric', labelVi: 'Xen kẽ Số & Chữ (A7B2)' },
        { value: 'audio', labelVi: 'Đọc số bằng âm thanh (Audio Dictation)' }
      ],
      default: 'digits'
    },
    {
      kind: 'number',
      key: 'flashPerItemMs',
      labelVi: 'Thời lượng hiển thị mỗi ký tự',
      descriptionVi: 'Tổng thời gian ghi nhớ tỷ lệ thuận với độ dài chuỗi',
      min: 250,
      max: 1200,
      step: 50,
      unit: 'ms',
      default: 420
    },
    {
      kind: 'boolean',
      key: 'chunkingGuide',
      labelVi: 'Bật phân nhịp Chunking (nhóm 3 số)',
      descriptionVi: 'Chia dãy số thành từng cụm 3 chữ số giúp tăng dung lượng trí nhớ làm việc',
      default: true
    }
  ]
};

export const DIGIT_SPAN_MODES: IExerciseModeDefinition<IDigitSpanParams>[] = [
  {
    id: 'digit-span.standard',
    exerciseSlug: 'digit-span',
    labelVi: 'Chuỗi Trí Nhớ Tùy Biến (Digit & N-Transform Span)',
    descriptionVi: 'Tùy chỉnh độ dài chuỗi (3–14), quy tắc biến đổi (xuôi/ngược/sắp xếp/cộng +1) và phân nhóm Chunking',
    status: 'stable',
    schema: digitSpanSchema,
    builtInPresets: [
      {
        id: 'miller_7_chunking',
        labelVi: 'Miller 7 Số Chuẩn',
        descriptionVi: 'Ngưỡng kinh điển 7±2 với nhịp phân nhóm 3-4',
        params: {
          sequenceLength: 7,
          recallRule: 'forward',
          stimulusType: 'digits',
          flashPerItemMs: 420,
          chunkingGuide: true
        }
      },
      {
        id: 'reverse_6_dlpfc',
        labelVi: 'Đảo Ngược 6 Số (dlPFC)',
        descriptionVi: 'Rèn thao tác đảo ngược chuỗi trong bộ nhớ làm việc',
        params: {
          sequenceLength: 6,
          recallRule: 'reverse',
          stimulusType: 'digits',
          flashPerItemMs: 480,
          chunkingGuide: true
        }
      },
      {
        id: 'chunking_10_master',
        labelVi: 'Siêu Trí Nhớ 10 Số Chunking',
        descriptionVi: 'Thử thách 10 số chia cụm 3-3-4 siêu tốc',
        params: {
          sequenceLength: 10,
          recallRule: 'forward',
          stimulusType: 'digits',
          flashPerItemMs: 360,
          chunkingGuide: true
        }
      }
    ]
  }
];
