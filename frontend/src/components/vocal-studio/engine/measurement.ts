/**
 * Real-time Vocal Pitch Measurement & Feedback State Machine
 * Fixes DEF-01: Explicit 3-state discrimination (NO_VOICE | NO_TARGET | MEASURED)
 */

export type PitchMeasureState =
  | { status: 'NO_VOICE' }
  | { status: 'NO_TARGET' }
  | {
      status: 'MEASURED';
      centsDiff: number;
      inTolerance: boolean;
      userFreqHz: number;
      targetMidi: number;
      userMidi: number;
    };

export interface PitchFeedbackDetail {
  status: 'in_tune' | 'flat' | 'sharp' | 'silence' | 'no_target';
  text: string;
  subText: string;
  badgeClass: string;
}

export function computePitchMeasurement(params: {
  isSinging: boolean;
  userFreqHz: number;
  userMidi: number;
  targetRefMidi: number | null;
  isTargetVocal: boolean;
  toleranceCents: number;
  smartOctaveFold: boolean;
  centsDiff: number;
}): PitchMeasureState {
  const { isSinging, userFreqHz, targetRefMidi, isTargetVocal, toleranceCents, centsDiff, userMidi } = params;

  if (!isSinging || userFreqHz <= 0) {
    return { status: 'NO_VOICE' };
  }

  if (targetRefMidi === null || !isTargetVocal || targetRefMidi <= 0) {
    return { status: 'NO_TARGET' };
  }

  const inTolerance = Math.abs(centsDiff) <= toleranceCents;

  return {
    status: 'MEASURED',
    centsDiff,
    inTolerance,
    userFreqHz,
    targetMidi: targetRefMidi,
    userMidi,
  };
}

export function getPitchFeedback(
  measureState: PitchMeasureState,
  toleranceCents: number
): PitchFeedbackDetail {
  if (measureState.status === 'NO_VOICE') {
    return {
      status: 'silence',
      text: 'Đang lắng nghe...',
      subText: 'Hãy cất giọng theo nốt',
      badgeClass: 'text-slate-400 bg-slate-800/80 border-slate-700',
    };
  }

  if (measureState.status === 'NO_TARGET') {
    return {
      status: 'no_target',
      text: 'Đoạn nghỉ / Đệm nhạc',
      subText: 'Chuẩn bị vào câu tiếp theo',
      badgeClass: 'text-slate-400 bg-slate-800/80 border-slate-700',
    };
  }

  const { centsDiff, inTolerance } = measureState;
  const absDiff = Math.abs(centsDiff);

  if (inTolerance) {
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
      subText: `${centsDiff} cents — Nâng nhẹ giọng lên`,
      badgeClass: 'text-amber-300 bg-amber-950/80 border-amber-500/50',
    };
  }

  return {
    status: 'sharp',
    text: absDiff > 45 ? 'Hơi cao (hạ nhẹ giọng ↘)' : 'Hơi cao ↘',
    subText: `+${centsDiff} cents — Hạ nhẹ giọng lại`,
    badgeClass: 'text-rose-300 bg-rose-950/80 border-rose-500/50',
  };
}
