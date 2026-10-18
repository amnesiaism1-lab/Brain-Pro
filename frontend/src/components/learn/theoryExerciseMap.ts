import { RelationId, ExerciseSlug } from '@brain-exercises/shared';

export type TheoryModuleId =
  | 'notes'
  | 'intervals'
  | 'chords'
  | 'scales'
  | 'rhythm'
  | 'timbre'
  | 'spatial'
  | 'polyphony'
  | 'sound-network'
  | 'hanoi-map';

export interface ITheoryModuleMeta {
  id: TheoryModuleId;
  order: number;
  title: string;
  shortTitle: string;
  icon: string;
  primaryEntity: string;
  taughtAttributes: string[];
  primaryRelation: RelationId;
  secondaryRelations: RelationId[];
  primarySlug: ExerciseSlug;
  secondarySlugs?: ExerciseSlug[];
  ctaLabelVi: string;
  relationBadgeVi: string;
  descriptionVi: string;
  remediateTagVi: string;
}

export const THEORY_MODULE_MAP: Record<TheoryModuleId, ITheoryModuleMeta> = {
  notes: {
    id: 'notes',
    order: 1,
    title: '1. Nốt Nhạc & Cao Độ',
    shortTitle: 'Nốt & Cao Độ',
    icon: '🎹',
    primaryEntity: 'Nốt đơn & Tần số dao động',
    taughtAttributes: ['freq (Hz)', 'midi', 'cents', 'octave', 'solfege'],
    primaryRelation: 'ORDER_SEQUENCE',
    secondaryRelations: ['IDENTITY_MATCH', 'SPATIAL_TRANSFORM'],
    primarySlug: 'pitch-recall',
    secondarySlugs: ['vocal-pitch-match'],
    ctaLabelVi: 'Luyện Nhớ Cao Độ Chuỗi',
    relationBadgeVi: 'ORDER_SEQUENCE · Thứ tự chuỗi',
    descriptionVi: 'Bản chất sóng âm, cao độ vật lý (Hz) và quy luật quãng 8 (Octave) 12-TET.',
    remediateTagVi: 'Cao độ nốt đơn & Tần số'
  },
  intervals: {
    id: 'intervals',
    order: 2,
    title: '2. Quãng Âm (Intervals)',
    shortTitle: 'Quãng Âm',
    icon: '🎼',
    primaryEntity: 'Cặp nốt (Khoảng cách cao độ)',
    taughtAttributes: ['semitones', 'direction', 'melodicVsHarmonic'],
    primaryRelation: 'SIMILARITY_DIFF',
    secondaryRelations: ['IDENTITY_MATCH', 'CONTEXT_MEANING'],
    primarySlug: 'interval-identify',
    ctaLabelVi: 'Luyện Nhận Diện Quãng Âm',
    relationBadgeVi: 'SIMILARITY_DIFF · So sánh vi sai',
    descriptionVi: 'Khoảng cách giữa hai cao độ, cảm giác căng thẳng (Dissonance) và êm dịu (Consonance).',
    remediateTagVi: 'Khoảng cách Quãng & Bán âm'
  },
  chords: {
    id: 'chords',
    order: 3,
    title: '3. Hợp Âm (Chords)',
    shortTitle: 'Hợp Âm',
    icon: '🎶',
    primaryEntity: 'Chồng âm & Màu sắc hòa thanh',
    taughtAttributes: ['quality (Trưởng/Thứ/Bảy)', 'inversion', 'spread', 'cadence'],
    primaryRelation: 'IDENTITY_MATCH',
    secondaryRelations: ['PART_WHOLE', 'TEMPORAL_PREDICT'],
    primarySlug: 'chord-identify',
    ctaLabelVi: 'Luyện Nhận Diện Hợp Âm',
    relationBadgeVi: 'IDENTITY_MATCH · Mẫu đồng nhất',
    descriptionVi: 'Chồng âm 3 nốt trở lên, thể đảo và tiến trình giải quyết hòa âm.',
    remediateTagVi: 'Chất hợp âm & Thể đảo'
  },
  scales: {
    id: 'scales',
    order: 4,
    title: '4. Âm Giai & Điệu Thức',
    shortTitle: 'Âm Giai',
    icon: '🎵',
    primaryEntity: 'Tập hợp bậc âm & Tâm thức điệu thức',
    taughtAttributes: ['modeId', 'rootNote', 'characterDegree', 'stepFormula'],
    primaryRelation: 'CONTEXT_MEANING',
    secondaryRelations: ['INHIBITION', 'RULE_ACTION'],
    primarySlug: 'pitch-recall',
    secondarySlugs: ['vocal-pitch-match'],
    ctaLabelVi: 'Luyện Dò Điệu Thức & Nốt Lạc Điệu',
    relationBadgeVi: 'CONTEXT_MEANING · Ngữ cảnh & Điệu tính',
    descriptionVi: '7 Church Modes, Pentatonic và sắc thái tâm lý của các thang âm kinh điển.',
    remediateTagVi: 'Điệu thức & Nốt ngoại điệu'
  },
  rhythm: {
    id: 'rhythm',
    order: 5,
    title: '5. Nhịp Điệu & Phách',
    shortTitle: 'Nhịp Điệu',
    icon: '🥁',
    primaryEntity: 'Phách, Ô nhịp & Khoảng lặng',
    taughtAttributes: ['bpm', 'stepIndex', 'accent', 'rest', 'timeSignature'],
    primaryRelation: 'TEMPORAL_PREDICT',
    secondaryRelations: ['INHIBITION', 'ORDER_SEQUENCE'],
    primarySlug: 'rhythm-recall',
    ctaLabelVi: 'Luyện Nhớ Nhịp Điệu (Rhythm)',
    relationBadgeVi: 'TEMPORAL_PREDICT · Dự đoán thời gian',
    descriptionVi: 'Phân chia thời gian, trọng âm phách 1 và nghệ thuật sử dụng dấu lặng (Rest).',
    remediateTagVi: 'Tiết tấu, Phách & Dấu lặng'
  },
  timbre: {
    id: 'timbre',
    order: 6,
    title: '6. Âm Sắc (Timbre)',
    shortTitle: 'Âm Sắc',
    icon: '🎸',
    primaryEntity: 'Dạng sóng & Chuỗi bồi âm',
    taughtAttributes: ['waveform', 'filterCutoff', 'articulation', 'partialGains'],
    primaryRelation: 'SIMILARITY_DIFF',
    secondaryRelations: ['PART_WHOLE', 'FOCUS_FIELD'],
    primarySlug: 'timbre-match',
    ctaLabelVi: 'Luyện Phân Biệt Âm Sắc & Bồi Âm',
    relationBadgeVi: 'SIMILARITY_DIFF · Sắc thái & Bồi âm',
    descriptionVi: 'Phổ hài âm (Harmonic Series), ADSR và cách phát âm (Articulation: Legato vs Staccato).',
    remediateTagVi: 'Dạng sóng, Bồi âm & Articulation'
  },
  spatial: {
    id: 'spatial',
    order: 7,
    title: '7. Âm Thanh 3D Không Gian',
    shortTitle: '3D Không Gian',
    icon: '🔊',
    primaryEntity: 'Nguồn âm trong trường không gian',
    taughtAttributes: ['pan', 'itd', 'ild', 'azimuth', 'distance'],
    primaryRelation: 'TARGET_POSITION',
    secondaryRelations: ['SPATIAL_TRANSFORM', 'FOCUS_FIELD'],
    primarySlug: 'sound-localization',
    ctaLabelVi: 'Luyện Định Vị Không Gian 3D',
    relationBadgeVi: 'TARGET_POSITION · Vị trí mục tiêu',
    descriptionVi: 'Độ lệch thời gian giữa hai tai (ITD) và định vị nguồn âm lập thể đa chiều.',
    remediateTagVi: 'Định vị âm thanh trái/phải'
  },
  polyphony: {
    id: 'polyphony',
    order: 8,
    title: '8. Đa Thanh & Bè Phối',
    shortTitle: 'Đa Thanh & Bè',
    icon: '🪈',
    primaryEntity: 'Dòng bè độc lập (Auditory Stream)',
    taughtAttributes: ['voiceCount', 'soloVoice', 'counterpointMotion', 'frequencySeparation'],
    primaryRelation: 'TARGET_DISTRACTOR',
    secondaryRelations: ['FOCUS_FIELD', 'INHIBITION'],
    primarySlug: 'voice-track',
    ctaLabelVi: 'Luyện Theo Dõi Bè Âm (Voice Track)',
    relationBadgeVi: 'TARGET_DISTRACTOR · Bè mục tiêu & Nhiễu',
    descriptionVi: 'Phân tách dòng thính giác, đối âm độc lập và theo dõi bè mục tiêu trong đám đông.',
    remediateTagVi: 'Tách bè & Theo dõi bè độc lập'
  },
  'sound-network': {
    id: 'sound-network',
    order: 9,
    title: '9. Mạng Lưới Hòa Âm & Cảm Âm Nâng Cao',
    shortTitle: 'Mạng Hòa Âm & Cảm Âm',
    icon: '⚡',
    primaryEntity: 'Đồ thị liên kết thực thể (Edge Matrix)',
    taughtAttributes: ['consonanceIndex', 'cadenceFunction', 'melodicContour', 'overtoneIndex'],
    primaryRelation: 'RULE_ACTION',
    secondaryRelations: ['PART_WHOLE', 'TEMPORAL_PREDICT'],
    primarySlug: 'chord-identify',
    secondarySlugs: ['timbre-match', 'pitch-recall', 'interval-identify'],
    ctaLabelVi: 'Luyện Cảm Âm Nâng Cao Trong Lab',
    relationBadgeVi: 'RULE_ACTION · Quy luật mạng lưới hòa âm',
    descriptionVi: 'Tương tác giữa các thực thể âm nhạc: Overtone Lab, Cadence Flow và Parsons Contour.',
    remediateTagVi: 'Mạng lưới hòa âm & Cảm âm nâng cao'
  },
  'hanoi-map': {
    id: 'hanoi-map',
    order: 10,
    title: '10. Bản Đồ Nhận Thức Hà Nội',
    shortTitle: 'Bản Đồ Hà Nội',
    icon: '🗺️',
    primaryEntity: 'Mạng lưới đô thị: 3 Vành đai, 8 Trục hướng tâm, Phố Pháp & Điểm neo',
    taughtAttributes: ['ringTier', 'bearingDeg', 'collinearChain', 'sunAzimuth', 'oneWayRule'],
    primaryRelation: 'TARGET_POSITION',
    secondaryRelations: ['SIMILARITY_DIFF', 'ORDER_SEQUENCE', 'RULE_ACTION'],
    primarySlug: 'hanoi-navigation',
    ctaLabelVi: 'Vào Luyện Tập Bản Đồ Hà Nội',
    relationBadgeVi: 'TARGET_POSITION · Định vị không gian đô thị',
    descriptionVi: 'Mô hình 5 thành phần Kevin Lynch, hệ quy chiếu kép Allocentric/Egocentric, la bàn mặt trời và chiến thuật tránh bẫy 1 chiều.',
    remediateTagVi: 'Bản đồ nhận thức, Vành đai & Hướng mặt trời'
  }
};

export const THEORY_MODULE_LIST: ITheoryModuleMeta[] = Object.values(THEORY_MODULE_MAP).sort(
  (a, b) => a.order - b.order
);

/**
 * Reverse lookup: maps an exercise slug to its primary theory module ID
 */
export function getTheoryModuleForSlug(slug: ExerciseSlug): TheoryModuleId | undefined {
  switch (slug) {
    case 'pitch-recall':
      return 'notes';
    case 'vocal-pitch-match':
      return 'notes';
    case 'interval-identify':
      return 'intervals';
    case 'chord-identify':
      return 'chords';
    case 'rhythm-recall':
      return 'rhythm';
    case 'timbre-match':
      return 'timbre';
    case 'sound-localization':
      return 'spatial';
    case 'voice-track':
      return 'polyphony';
    case 'hanoi-navigation':
      return 'hanoi-map';
    default:
      return undefined;
  }
}

/**
 * Maps a wrong answer context or slug to the most appropriate theory module
 */
export function getTheoryModuleForWrongAnswer(
  slug: ExerciseSlug,
  questionContext?: Record<string, any>
): TheoryModuleId {
  if (slug === 'hanoi-navigation') {
    return 'hanoi-map';
  }
  // If the wrong answer has explicit scale/mode context
  if (questionContext?.mode || questionContext?.scale) {
    return 'scales';
  }
  // If the wrong answer is in rhythm and refers to rests
  if (slug === 'rhythm-recall' && (questionContext?.isRest || questionContext?.hasRest)) {
    return 'rhythm';
  }
  return getTheoryModuleForSlug(slug) || 'notes';
}
