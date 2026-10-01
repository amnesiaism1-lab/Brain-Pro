import { ExerciseSlug } from './index';
export type AuditoryErrorCategory = 'INTERVAL_CONFUSION' | 'CHORD_MISIDENTIFY' | 'PITCH_DRIFT' | 'TIMBRE_CONFUSION' | 'RHYTHM_TIMING_ERROR' | 'RHYTHM_PATTERN_ERROR' | 'SPATIAL_DIRECTION_ERROR' | 'VOCAL_INTONATION_ERROR';
export type ErrorSeverity = 'minor' | 'moderate' | 'critical';
export interface IAnswerDetail {
    label: string;
    code: string;
    semitones?: number;
    frequency?: number;
    centsDeviation?: number;
    timingDeltaMs?: number;
    azimuthDeg?: number;
    musicalNotation?: string;
    explanationVi?: string;
}
export interface IQuestionContext {
    rootNote?: string;
    targetNote?: string;
    playbackMode?: 'ascending' | 'descending' | 'harmonic';
    chordRoot?: string;
    chordVoicing?: 'block' | 'arpeggio';
    isCadenceMode?: boolean;
    isImpliedHarmonyMode?: boolean;
    notes?: string[];
    sequenceNotes?: string[];
    contourType?: string;
    isOctaveLeap?: boolean;
    isReverseRecall?: boolean;
    targetWaveform?: string;
    targetFilter?: string;
    isOvertoneMode?: boolean;
    isArticulationMode?: boolean;
    harmonicIndex?: number;
    articulationType?: string;
    bpm?: number;
    stepCount?: number;
    isSwing?: boolean;
    isMultiDrum?: boolean;
    patternHash?: string;
    isRestMode?: boolean;
    isAccentMode?: boolean;
    targetAzimuth?: number;
    targetDistance?: 'near' | 'mid' | 'far';
    targetPitchHz?: number;
    targetNoteName?: string;
    centsTolerance?: number;
}
export interface IWrongAnswer {
    id: string;
    userId?: string;
    exerciseSlug: ExerciseSlug;
    difficultyLevel: number;
    round: number;
    questionContext: IQuestionContext;
    correctAnswer: IAnswerDetail;
    userAnswer: IAnswerDetail;
    errorCategory: AuditoryErrorCategory;
    severity: ErrorSeverity;
    confusionPairKey: string;
    responseTimeMs: number;
    timestamp: string;
    sessionId: string;
    reviewStatus: 'new' | 'reviewing' | 'mastered';
    reviewCount: number;
    lastReviewedAt: string | null;
    nextReviewAt: string | null;
    easeFactor: number;
    consecutiveCorrectInReview?: number;
}
export interface IConfusionPairStat {
    pairKey: string;
    exerciseSlug: ExerciseSlug;
    labelA: string;
    labelB: string;
    codeA: string;
    codeB: string;
    totalErrors: number;
    recentErrors: number;
    avgResponseMs: number;
    masteredAt: string | null;
    trendDirection: 'improving' | 'stagnant' | 'declining';
    lastOccurredAt: string;
}
export interface IAuditoryProgressSnapshot {
    date: string;
    exerciseSlug: ExerciseSlug;
    totalQuestions: number;
    wrongCount: number;
    accuracyRate: number;
    topConfusionPairs: IConfusionPairStat[];
    avgResponseMs: number;
    levelAtTime: number;
}
export interface IReviewRecommendation {
    id: string;
    exerciseSlug: ExerciseSlug;
    confusionPairKey: string;
    title: string;
    urgency: 'high' | 'medium' | 'low';
    reason: string;
    suggestedLevel: number;
    estimatedReviewMinutes: number;
    totalWrongCount: number;
    exampleQuestionContext?: IQuestionContext;
}
export interface IWrongAnswerFilter {
    exerciseSlug: ExerciseSlug | 'ALL';
    severity: ErrorSeverity | 'ALL';
    reviewStatus: 'new' | 'reviewing' | 'mastered' | 'ALL';
    dateRange: 'today' | 'week' | 'month' | 'all';
    searchQuery?: string;
}
