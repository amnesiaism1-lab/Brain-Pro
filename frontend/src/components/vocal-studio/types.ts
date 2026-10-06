import { IVocalAnalysisResult, IVocalPhrase, IReferencePitchPoint } from '../../services/vocalFileAnalysisService';
import { IVocalPitchReading } from '../../services/vocalPitchService';

export type StudioTab = 'analysis' | 'sing_along' | 'report';

export type MicStatus = 'idle' | 'connecting' | 'listening' | 'error' | 'permission_denied';

export type TuningTolerance = 20 | 35 | 50;

export interface SingSessionStats {
  totalVocalFrames: number;
  inTuneFrames: number;
  flatFrames: number;
  sharpFrames: number;
  highestStreak: number;
  phraseScores: Record<number, { total: number; inTune: number }>;
}

export interface RunwayRenderState {
  currentTimeMs: number;
  durationMs: number;
  pitchTrack: IReferencePitchPoint[];
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
