export type CognitiveCategoryCode = 
  | 'SPEED_READING'
  | 'PERIPHERAL_VISION'
  | 'MEMORY'
  | 'ATTENTION'
  | 'REACTION';

export type ExerciseSlug =
  | 'anagram'              // Đảo ngữ
  | 'schulte-table'        // Bảng Schulte
  | 'find-letter'          // Tìm chữ
  | 'find-number'          // Tìm Số
  | 'even-odd'             // Chẵn/Lẻ
  | 'digit-span'           // Nhớ Số
  | 'rsvp-speed-reader'    // Chữ Chạy
  | 'word-search'          // Tìm Từ
  | 'twin-words'           // Từ Sinh đôi
  | 'peripheral-vision'    // Tầm Nhìn
  | 'green-dot'            // Điểm xanh
  | 'word-chunking'        // Chuỗi từ
  | 'reading-assessment'   // Đánh giá tốc độ đọc
  | 'reading-pacer'        // Tăng tốc độ đọc
  | 'text-scanning'        // Tìm trong văn bản
  | 'card-flip'            // Lật Thẻ Trí Nhớ 3D (Phát triển nâng cao)
  | 'stroop-clash'         // Đấu Màu Nhận Thức (Stroop Effect)
  | 'spatial-memory'       // Nhớ Khối Không Gian (Corsi Block Tapping)
  | 'saccade-tracker';     // Theo Dõi Mắt Nhanh (Saccadic Eye Tracking)

export type WorkoutRoutineCode =
  | 'QUICK_5M'
  | 'REGULAR_10M'
  | 'OPTIMAL_30M'
  | 'INTENSIVE_60M';

export interface ICognitiveCategory {
  id: string;
  code: CognitiveCategoryCode;
  name: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface IExerciseLevelConfig {
  id?: string;
  level: number; // 1 to 12
  gridRows?: number;
  gridCols?: number;
  targetItemCount?: number;
  timeLimitSec: number;
  speedWpm?: number;
  variantCode?: string;
  variantName?: string;
  parametersJson?: Record<string, unknown>;
}

export interface IExerciseVariant {
  id: string;
  exerciseSlug: ExerciseSlug;
  minLevel: number;
  maxLevel: number;
  variantCode: string;
  variantName: string;
  variantDescription: string;
  variantConfig: Record<string, unknown>;
}

export type SynergyType = 'COMPLEMENTARY' | 'PROGRESSIVE' | 'CONTRAST';

export interface IExerciseSynergy {
  id: string;
  exerciseASlug: ExerciseSlug;
  exerciseBSlug: ExerciseSlug;
  synergyType: SynergyType;
  title: string;
  description: string;
  bonusXpPercent: number;
}

export interface IExerciseContentPoolItem {
  id: string;
  exerciseSlug: ExerciseSlug;
  contentType: string; // 'passage' | 'word_list' | 'target_pattern' | 'quiz_pack'
  contentData: Record<string, unknown>;
  difficultyTier: number; // 1 to 4
  timesUsed: number;
  lastUsedAt?: string;
}

export interface IUserExerciseMastery {
  exerciseSlug: ExerciseSlug;
  currentLevel: number; // 1 to 12
  highestLevelReached: number;
  totalAttempts: number;
  perfectAttempts: number;
  avgAccuracy: number;
  avgReactionMs: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  lastPlayedAt?: string;
}

export interface IUserCognitiveSnapshot {
  id: string;
  userId?: string;
  snapshotDate: string;
  speedReadingScore: number;
  peripheralVisionScore: number;
  memoryScore: number;
  attentionScore: number;
  reactionScore: number;
  overallBrainAge: number;
}

export interface IUserContentHistory {
  id: string;
  userId: string;
  contentPoolId: string;
  exerciseSlug: ExerciseSlug;
  seenAt: string;
}

export interface IWeeklyChallenge {
  id: string;
  title: string;
  description: string;
  exerciseSlug: ExerciseSlug;
  targetScore: number;
  targetLevel: number;
  xpReward: number;
  expiresAt: string;
  isCompleted?: boolean;
}

export interface IExercise {
  id: string;
  categoryId: string;
  categoryCode: CognitiveCategoryCode;
  categoryName: string;
  slug: ExerciseSlug;
  title: string;
  subtitle: string;
  iconName: string;
  scientificBasis: string;
  instructions: string;
  rulesSummary: string;
  maxDifficultyLevel: number;
  defaultDurationSec: number;
  isFeatured: boolean;
  levelConfigs: IExerciseLevelConfig[];
}

export interface IWorkoutRoutineItem {
  id?: string;
  exerciseId: string;
  exerciseTitle: string;
  exerciseSlug: ExerciseSlug;
  orderIndex: number;
  recommendedDurationSec: number;
}

export interface IWorkoutRoutine {
  id: string;
  code: WorkoutRoutineCode;
  title: string;
  durationMinutes: number;
  starRating: number;
  description: string;
  isDefault: boolean;
  items: IWorkoutRoutineItem[];
}

export interface IGameAttemptRequest {
  exerciseSlug: ExerciseSlug;
  difficultyLevel: number;
  score: number;
  accuracyRate: number; // 0 to 100
  timeSpentSec: number;
  effectiveWpm?: number;
  rawMetricsJson?: Record<string, unknown>;
  sessionId?: string;
}

export interface IGameAttemptResponse {
  id: string;
  score: number;
  xpEarned: number;
  currentLevel: number;
  totalXp: number;
  currentStreak: number;
  recommendedNextLevel: number;
  isNewHighScore: boolean;
  message: string;
}

export interface IReadingQuestion {
  id: string;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface IReadingText {
  id: string;
  title: string;
  category: string;
  wordCount: number;
  difficultyLevel: number;
  content: string;
  previewExcerpt: string;
  author: string;
  questions?: IReadingQuestion[];
}

export interface IUserAssessmentRequest {
  readingTextId: string;
  readingTimeSec: number;
  answers: Array<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }>;
}

export interface IUserAssessmentResponse {
  id: string;
  rawWpm: number;
  comprehensionScore: number; // percentage
  effectiveWpm: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  feedback: string;
  xpEarned: number;
}

export interface ICognitiveRadar {
  speedReadingScore: number;
  peripheralVisionScore: number;
  memoryScore: number;
  attentionScore: number;
  reactionScore: number;
}

export interface IUserProfile {
  id: string;
  userId: string;
  preferredLanguage: 'vi' | 'en';
  targetWpm: number;
  dailyGoalMinutes: number;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'sepia';
  autoDifficultyDefault: boolean;
}

export interface IUserStats {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  bestStreak: number;
  totalSessions: number;
  totalMinutesTrained: number;
  averageWpm: number;
  radar: ICognitiveRadar;
}

export interface IUserReminder {
  id: string;
  reminderTime: string; // HH:mm
  daysOfWeek: number[]; // 0: Sunday, 1: Monday, ...
  isEnabled: boolean;
  label: string;
}

export interface IUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  bestStreak: number;
  profile?: IUserProfile;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}
