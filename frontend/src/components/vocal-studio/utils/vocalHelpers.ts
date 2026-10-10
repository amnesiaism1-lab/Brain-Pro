import { IReferencePitchPoint } from '../../../services/vocalFileAnalysisService';
export { NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';

/**
 * Mathematically exact binary search to find the closest reference pitch frame
 * Fixes BUG-04 (which previously used linear scan around flawed uniform index)
 */
export function findClosestPitchPoint(
  pitchTrack: IReferencePitchPoint[],
  timeMs: number
): IReferencePitchPoint | null {
  if (!pitchTrack || pitchTrack.length === 0) return null;

  let low = 0;
  let high = pitchTrack.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = pitchTrack[mid].timeMs;

    if (midTime === timeMs) {
      return pitchTrack[mid];
    }
    if (midTime < timeMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // After loop, high < low; compare boundaries to pick strictly closest frame
  const idx1 = Math.max(0, high);
  const idx2 = Math.min(pitchTrack.length - 1, low);

  const diff1 = Math.abs(pitchTrack[idx1].timeMs - timeMs);
  const diff2 = Math.abs(pitchTrack[idx2].timeMs - timeMs);

  return diff1 <= diff2 ? pitchTrack[idx1] : pitchTrack[idx2];
}

/**
 * Formats time in milliseconds to MM:SS format
 */
export function formatTimeMs(timeMs: number): string {
  if (isNaN(timeMs) || timeMs < 0) return '0:00';
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Human-friendly feedback for pitch deviation (Nielsen Heuristic H2)
 * Fixes DEF-01: Does not falsely claim 'Chuẩn cao độ!' when there is no target note playing
 */
export interface PitchFeedbackDetail {
  status: 'in_tune' | 'flat' | 'sharp' | 'silence';
  text: string;
  subText: string;
  badgeClass: string;
}

export function getPitchFeedback(
  centsDiff: number,
  toleranceCents: number,
  isSinging: boolean,
  isTargetActive = true
): PitchFeedbackDetail {
  if (!isSinging) {
    return {
      status: 'silence',
      text: 'Đang lắng nghe...',
      subText: 'Hãy cất giọng theo nốt',
      badgeClass: 'text-slate-400 bg-slate-800/80 border-slate-700',
    };
  }

  if (!isTargetActive) {
    return {
      status: 'silence',
      text: 'Đoạn nghỉ / Đệm nhạc',
      subText: 'Chuẩn bị vào câu tiếp theo',
      badgeClass: 'text-slate-400 bg-slate-800/80 border-slate-700',
    };
  }

  const absDiff = Math.abs(centsDiff);
  if (absDiff <= toleranceCents) {
    return {
      status: 'in_tune',
      text: 'Chuẩn cao độ!',
      subText: `Khớp ${absDiff === 0 ? 'tuyệt đối' : `${absDiff} cents`}`,
      badgeClass: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50 shadow-emerald-500/20 shadow-sm',
    };
  }

  if (centsDiff < -toleranceCents) {
    return {
      status: 'flat',
      text: absDiff > 45 ? 'Hơi thấp (nâng nhẹ lên ↗)' : 'Hơi thấp ↗',
      subText: `${centsDiff} cents — Hãy đẩy giọng cao hơn ↗`,
      badgeClass: 'text-amber-300 bg-amber-950/80 border-amber-500/50',
    };
  }

  return {
    status: 'sharp',
    text: absDiff > 45 ? 'Hơi cao (hạ nhẹ giọng ↘)' : 'Hơi cao ↘',
    subText: `+${centsDiff} cents — Hãy hạ giọng nhẹ lại ↘`,
    badgeClass: 'text-rose-300 bg-rose-950/80 border-rose-500/50',
  };
}
