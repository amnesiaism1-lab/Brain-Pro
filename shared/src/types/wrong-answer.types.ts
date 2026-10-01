import { ExerciseSlug } from './index';

/** Danh mục lỗi thính giác (Auditory Error Taxonomy) */
export type AuditoryErrorCategory =
  | 'INTERVAL_CONFUSION'      // Nhầm quãng (VD: 3m ↔ 3M)
  | 'CHORD_MISIDENTIFY'       // Nhầm hợp âm (VD: Major ↔ Minor)
  | 'PITCH_DRIFT'             // Trôi cao độ (VD: C4 → C#4)
  | 'TIMBRE_CONFUSION'        // Nhầm âm sắc (VD: sine ↔ triangle)
  | 'RHYTHM_TIMING_ERROR'     // Lệch nhịp (VD: tap lệch beat)
  | 'RHYTHM_PATTERN_ERROR'    // Sai pattern (VD: sót phách, gõ thừa)
  | 'SPATIAL_DIRECTION_ERROR' // Sai hướng không gian 3D (VD: trái ↔ phải)
  | 'VOCAL_INTONATION_ERROR'; // Hát sai cao độ (VD: lệch >50 cents)

/** Mức độ nghiêm trọng của lỗi */
export type ErrorSeverity = 'minor' | 'moderate' | 'critical';

/** Chi tiết một đáp án (đáp án đúng hoặc lựa chọn của người dùng) */
export interface IAnswerDetail {
  label: string;                        // Hiển thị: 'Quãng 3 Trưởng (M3)'
  code: string;                         // Machine code: '3M', 'Major', 'sine'
  
  // Auditory-specific fields
  semitones?: number;                   // Cho interval: VD 4
  frequency?: number;                   // Cho pitch: VD 440.0
  centsDeviation?: number;              // Cho vocal: VD -35
  timingDeltaMs?: number;               // Cho rhythm: VD 120
  azimuthDeg?: number;                  // Cho spatial: VD 270
  
  // Ghi chú âm nhạc / sư phạm
  musicalNotation?: string;             // VD: '♩♩♪♩' cho rhythm, '1 - 3 - 5' cho hợp âm
  explanationVi?: string;               // Giải thích sư phạm ngắn gọn bằng tiếng Việt
}

/** Ngữ cảnh câu hỏi sinh ra lỗi — linh hoạt cho từng bài tập */
export interface IQuestionContext {
  // Interval Identify
  rootNote?: string;                    // VD: 'C4'
  targetNote?: string;                  // VD: 'E4'
  playbackMode?: 'ascending' | 'descending' | 'harmonic';
  
  // Chord Identify
  chordRoot?: string;                   // VD: 'G3'
  chordVoicing?: 'block' | 'arpeggio';
  isCadenceMode?: boolean;
  isImpliedHarmonyMode?: boolean;
  notes?: string[];
  
  // Pitch Recall
  sequenceNotes?: string[];             // VD: ['C4', 'E4', 'G4']
  contourType?: string;                 // VD: 'ARCH', 'UP'
  isOctaveLeap?: boolean;
  isReverseRecall?: boolean;
  
  // Timbre Match
  targetWaveform?: string;              // VD: 'sawtooth'
  targetFilter?: string;                // VD: 'lowpass-1800'
  isOvertoneMode?: boolean;
  isArticulationMode?: boolean;
  harmonicIndex?: number;
  articulationType?: string;
  
  // Rhythm Recall
  bpm?: number;
  stepCount?: number;
  isSwing?: boolean;
  isMultiDrum?: boolean;
  patternHash?: string;
  isRestMode?: boolean;
  isAccentMode?: boolean;
  
  // Sound Localization
  targetAzimuth?: number;               // VD: 90 (degrees)
  targetDistance?: 'near' | 'mid' | 'far';
  
  // Vocal Pitch Match
  targetPitchHz?: number;
  targetNoteName?: string;              // VD: 'A4'
  centsTolerance?: number;
}

/** Bản ghi một câu làm sai */
export interface IWrongAnswer {
  id: string;                           // UUID
  userId?: string;                      // Optional ID người dùng
  
  // === Thông tin bài tập ===
  exerciseSlug: ExerciseSlug;           // VD: 'interval-identify'
  difficultyLevel: number;              // Level 1-22
  round: number;                        // Vòng thứ mấy trong session
  
  // === Thông tin câu hỏi ===
  questionContext: IQuestionContext;
  
  // === Đáp án đúng vs sai ===
  correctAnswer: IAnswerDetail;
  userAnswer: IAnswerDetail;
  
  // === Phân loại lỗi ===
  errorCategory: AuditoryErrorCategory;
  severity: ErrorSeverity;
  confusionPairKey: string;             // VD: '3m:3M', 'Major:Minor' (luôn sort alphabetical)
  
  // === Timing & Hiệu suất ===
  responseTimeMs: number;               // Thời gian phản hồi tính bằng ms
  
  // === Metadata ===
  timestamp: string;                    // ISO 8601
  sessionId: string;                    // Group các câu trong 1 lượt chơi
  
  // === Trạng thái ôn tập (Spaced Repetition System - SM-2) ===
  reviewStatus: 'new' | 'reviewing' | 'mastered';
  reviewCount: number;                  // Số lần đã thực hiện ôn tập
  lastReviewedAt: string | null;        // Lần ôn gần nhất (ISO)
  nextReviewAt: string | null;          // Thời điểm cần ôn tiếp theo (ISO)
  easeFactor: number;                   // Hệ số dễ SM-2 (mặc định 2.5)
  consecutiveCorrectInReview?: number;  // Số lần làm đúng liên tiếp khi ôn
}

/** Thống kê cặp nhầm lẫn tổng hợp */
export interface IConfusionPairStat {
  pairKey: string;                      // VD: '3m:3M'
  exerciseSlug: ExerciseSlug;
  labelA: string;                       // Tên lựa chọn A
  labelB: string;                       // Tên lựa chọn B
  codeA: string;
  codeB: string;
  totalErrors: number;                  // Tổng số lần nhầm lẫn
  recentErrors: number;                 // Số lần nhầm trong 7 ngày gần nhất
  avgResponseMs: number;                // Thời gian phản hồi trung bình
  masteredAt: string | null;            // null nếu chưa master
  trendDirection: 'improving' | 'stagnant' | 'declining';
  lastOccurredAt: string;               // ISO 8601
}

/** Snapshot tiến bộ cảm âm theo ngày */
export interface IAuditoryProgressSnapshot {
  date: string;                         // YYYY-MM-DD
  exerciseSlug: ExerciseSlug;
  totalQuestions: number;
  wrongCount: number;
  accuracyRate: number;                 // 0 - 100%
  topConfusionPairs: IConfusionPairStat[];
  avgResponseMs: number;
  levelAtTime: number;
}

/** Đề xuất ôn tập thông minh */
export interface IReviewRecommendation {
  id: string;
  exerciseSlug: ExerciseSlug;
  confusionPairKey: string;
  title: string;                        // VD: "Phân biệt Quãng 3 Thứ (m3) và Quãng 3 Trưởng (M3)"
  urgency: 'high' | 'medium' | 'low';
  reason: string;                       // Lý do đề xuất (VD: "Bạn nhầm cặp này 6 lần trong 3 ngày qua")
  suggestedLevel: number;
  estimatedReviewMinutes: number;
  totalWrongCount: number;
  exampleQuestionContext?: IQuestionContext;
}

/** Bộ lọc danh sách câu sai */
export interface IWrongAnswerFilter {
  exerciseSlug: ExerciseSlug | 'ALL';
  severity: ErrorSeverity | 'ALL';
  reviewStatus: 'new' | 'reviewing' | 'mastered' | 'ALL';
  dateRange: 'today' | 'week' | 'month' | 'all';
  searchQuery?: string;
}
