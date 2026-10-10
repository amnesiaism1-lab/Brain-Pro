import { IVocalAnalysisResult, IVocalPhrase, IReferencePitchPoint } from '../../services/vocalFileAnalysisService';
import { IVocalPitchReading } from '../../services/vocalPitchService';

export type StudioTab = 'analysis' | 'sing_along' | 'report';

export type MicStatus = 'idle' | 'connecting' | 'listening' | 'error' | 'permission_denied';

/**
 * Tuning tolerance in cents:
 * 50: Dễ (Easy)
 * 35: Chuẩn (Standard)
 * 20: Khó (Hard)
 * 10: Chuyên gia (Expert)
 */
export type TuningTolerance = 10 | 20 | 35 | 50;

/**
 * Target note guidance mode:
 * 'quantized': Snaps target to exact equal-tempered semitone (Standard Note)
 * 'original': Follows raw micro-pitch bend of the audio file (Original Track)
 */
export type TargetPitchMode = 'quantized' | 'original';

export type PhraseViewMode = 'grid' | 'timeline_minutes' | 'needs_practice';

export interface SingSessionStats {
  totalVocalFrames: number;
  inTuneFrames: number;
  flatFrames: number;
  sharpFrames: number;
  highestStreak: number;
  phraseScores: Record<number, { total: number; inTune: number }>;
}

export interface IUserPitchPoint {
  timeMs: number;
  midi: number;
  rawMidi?: number;
  freqHz: number;
  centsDiff: number;
  inTune: boolean;
  trend?: 'in_tune' | 'sharp' | 'flat';
}

export type OctaveConvention = 'fl_studio' | 'international';

export interface IVocalNoteBar {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  midi: number;
  exactMidi: number;
  noteName: string;
  solfegeName: string;
  avgCentsDiff: number;
  pointsCount: number;
  rmsEnvelope?: number[];
}

export interface RunwayRenderState {
  currentTimeMs: number;
  durationMs: number;
  pitchTrack: IReferencePitchPoint[];
  userPitchTrail: IUserPitchPoint[];
  currentRefPoint: IReferencePitchPoint | null;
  userReading: IVocalPitchReading | null;
  isInTuneNow: boolean;
  currentCentsDiff: number;
  isLoopingActive: boolean;
  loopStartMs: number | null;
  loopEndMs: number | null;
  smartOctaveFold: boolean;
  lowestMidi: number;
  highestMidi: number;
  toleranceCents: number;
  targetMode?: TargetPitchMode;
  isWindowLocked?: boolean;
  noteBars?: IVocalNoteBar[];
  latencyOffsetMs?: number;
  scaleNotes?: string[];
  transposeSemitones?: number;
  snapToScale?: boolean;
  selectedKeyName?: string;
  octaveConvention?: OctaveConvention;
}
