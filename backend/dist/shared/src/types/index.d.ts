export type CognitiveCategoryCode = 'SPEED_READING' | 'PERIPHERAL_VISION' | 'MEMORY' | 'ATTENTION' | 'REACTION' | 'AUDITORY_MEMORY';
export type ExerciseSlug = 'anagram' | 'schulte-table' | 'find-letter' | 'find-number' | 'even-odd' | 'digit-span' | 'rsvp-speed-reader' | 'word-search' | 'twin-words' | 'peripheral-vision' | 'green-dot' | 'word-chunking' | 'reading-assessment' | 'reading-pacer' | 'text-scanning' | 'card-flip' | 'stroop-clash' | 'spatial-memory' | 'saccade-tracker' | 'pitch-recall' | 'interval-identify' | 'rhythm-recall' | 'chord-identify' | 'timbre-match' | 'sound-localization' | 'voice-track' | 'relational-network' | 'causal-cascade' | 'graph-memory-matrix' | 'rule-mutation-clash';
export type ArticulationType = 'legato' | 'staccato' | 'tenuto' | 'accent';
export type MelodicContourCode = 'UP' | 'DOWN' | 'REPEAT' | 'ARCH' | 'INVERTED_ARCH';
export type CadenceType = 'AUTHENTIC' | 'HALF' | 'DECEPTIVE' | 'PLAGAL';
export interface IAudioEvent {
    note?: string;
    freq?: number;
    timeMs: number;
    durationMs: number;
    velocity?: number;
    pan?: number;
    timbre?: string;
    articulation?: ArticulationType;
    partialGains?: number[];
    rest?: boolean;
    layer?: 'A' | 'B' | 'C';
    harmonyChange?: boolean;
}
export type WorkoutRoutineCode = 'QUICK_5M' | 'REGULAR_10M' | 'OPTIMAL_30M' | 'INTENSIVE_60M';
export interface ICognitiveCategory {
    id: string;
    code: CognitiveCategoryCode;
    name: string;
    description: string;
    iconName: string;
    sortOrder: number;
}
export type InfinityTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type InfinityPatternMode = 'fibonacci' | 'mirror' | 'chaos' | 'rhythm' | 'pendulum' | 'cascade' | 'infinite';
export interface IInfinityMetadata {
    tier: InfinityTier;
    romanNumeral: string;
    enTheme?: string;
    apiSource?: string;
    pattern?: InfinityPatternMode;
    externalEntityRelation?: string;
}
export interface IExerciseLevelConfig {
    id?: string;
    level: number;
    gridRows?: number;
    gridCols?: number;
    targetItemCount?: number;
    timeLimitSec: number;
    speedWpm?: number;
    variantCode?: string;
    variantName?: string;
    parametersJson?: Record<string, unknown>;
    infinityTier?: InfinityTier;
    infinityMetadata?: IInfinityMetadata;
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
    contentType: string;
    contentData: Record<string, unknown>;
    difficultyTier: number;
    timesUsed: number;
    lastUsedAt?: string;
}
export interface IUserExerciseMastery {
    exerciseSlug: ExerciseSlug;
    currentLevel: number;
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
    overallTrainingIndex: number;
    overallBrainAge?: number;
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
    accuracyRate: number;
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
    language?: 'vi' | 'en';
    questions?: IReadingQuestion[];
}
export interface IUserAssessmentRequest {
    readingTextId: string;
    readingTimeSec: number;
    answers: Array<{
        questionId: string;
        selectedOption: 'A' | 'B' | 'C' | 'D';
    }>;
}
export interface IUserAssessmentResponse {
    id: string;
    rawWpm: number;
    comprehensionScore: number;
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
    reminderTime: string;
    daysOfWeek: number[];
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
