import { IVocalAnalysisResult, IVocalPhrase, IReferencePitchPoint } from '../../services/vocalFileAnalysisService';
import { IVocalPitchReading } from '../../services/vocalPitchService';

export type StudioTab = 'analysis' | 'sing_along' | 'report';

export type MicStatus = 'idle' | 'connecting' | 'listening' | 'error' | 'permission_denied';

export type TuningTolerance = 20 | 35 | 50;

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
  freqHz: number;
  centsDiff: number;
  inTune: boolean;
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
}
