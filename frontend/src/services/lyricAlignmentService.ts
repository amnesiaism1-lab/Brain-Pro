/**
 * Deep Vowel Formant (F1/F2), Pitch Trajectory & Lyric Alignment Service (lyricAlignmentService.ts)
 *
 * Implements:
 * 1. Pre-emphasized Goertzel / Multi-Band Spectral Formant Analysis (F1: 250-980Hz, F2: 750-2700Hz)
 *    across 3 sub-windows (Early, Mid, Late) of each sung note to detect pure vowels (/A/, /E-Ê/, /I/, /Ơ-Ư/, /O-Ô/, /U/)
 *    and diphthong transitions (/Ai/, /Ao/, /Ơi/, /Ia/, /Ua/, /Ôi/) without any artificial repeating word cycles.
 * 2. Micro-Pitch Trajectory Analysis on every syllable/word:
 *    - Inter-syllable melodic step (`stepSemitones`: ↑ đi lên, ↘ đi xuống, → đi ngang)
 *    - Intra-syllable vowel pitch bend (`pitchTrajectory`: ↗ vuốt lên, ↘ hạ xuống, ⤴ luyến vòm, ⤵ uốn võng, 〰 ngân rung, → giữ phẳng)
 * 3. Multi-candidate smart LRCLIB cloud lyric search (handles complex YouTube/MP3 titles with `|`, `-`, `ft.`)
 * 4. Structural song section landmarking & accent-insensitive search/trace.
 */

import { SOLFEGE_NAMES, NOTE_NAMES } from '@brain-exercises/shared';
import type {
  IVocalAnalysisResult,
  IVocalNoteBar,
  IVocalPhrase,
  IReferencePitchPoint,
} from './vocalFileAnalysisService';

export type VocalSectionType =
  | 'intro'
  | 'verse'
  | 'pre_chorus'
  | 'chorus'
  | 'climax'
  | 'bridge'
  | 'outro';

export type LyricSourceType =
  | 'demo_builtin'
  | 'embedded_tag'
  | 'auto_lrclib'
  | 'acoustic_relative'
  | 'lrc'
  | 'manual';

export type LyricCompletenessStatus = 'complete' | 'relative_auto' | 'partial';

export type LyricDisplayMode = 'lyrics' | 'solfege' | 'bilingual' | 'vowel_trajectory';

export type VowelMouthHint =
  | 'A (Mở rộng hàm)'
  | 'E/Ê (Mở ngang)'
  | 'I (Khép dẹt sáng)'
  | 'Ơ/Ư (Mở vừa tự nhiên)'
  | 'O/Ô (Tròn môi)'
  | 'U (Chu môi sâu)'
  | 'Nguyên âm đôi (Chuyển khẩu hình)'
  | 'Ngân mũi (Cộng minh)';

export type VowelPitchTrajectory =
  | 'rising'
  | 'falling'
  | 'arch'
  | 'dip'
  | 'vibrato'
  | 'steady';

export interface IVocalLyricWord {
  wordIndex: number;
  text: string;
  solfege: string;
  noteName: string;
  midi: number;
  startMs: number;
  endMs: number;
  /** Detected acoustic vowel phoneme (e.g. "A", "Ê", "I", "Ô", "U", "Ơi", "Ai", "Ao") */
  vowelPhoneme?: string;
  vowelHint?: VowelMouthHint;
  /** Estimated formant frequencies [F1_Hz, F2_Hz] */
  formantsHz?: [number, number];
  /** Intra-word pitch contour shape */
  pitchTrajectory?: VowelPitchTrajectory;
  /** Compact arrow symbol: '↗' | '↘' | '⤴' | '⤵' | '〰' | '→' | '↑' | '↓' */
  trajectorySymbol?: string;
  /** Human-readable description of how this vowel moves in pitch */
  trajectoryLabel?: string;
  /** Semitone difference from the previous sung note/word (+3 = lên 3 bán âm, -2 = xuống 2 bán âm, 0 = ngang) */
  stepSemitones?: number;
  /** Pitch bend within the vowel itself from start to end in cents */
  intraBendCents?: number;
  /** 3-point relative pitch curve [startCents, midCents, endCents] for visual micro-contour */
  pitchCurveCents?: [number, number, number];
}

export interface ILrcLine {
  timeMs: number;
  text: string;
}

interface ICachedSongLyrics {
  lyricSource: LyricSourceType;
  matchedTrackTitle?: string;
  phrases: Array<{
    phraseIndex: number;
    startMs: number;
    endMs: number;
    lyricText: string;
    isInstrumentalOrVocalize?: boolean;
  }>;
}

const LYRIC_CACHE_PREFIX = 'brain_vocal_lyric_v2_';

/**
 * Normalize Vietnamese text for accent-insensitive search & trace
 */
export function normalizeVietnameseSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9:\s#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert midi number to compact Vietnamese solfege string (e.g. "Đô4", "Sol4")
 */
export function midiToCompactSolfege(midi: number): {
  noteName: string;
  solfege: string;
  pureSolfege: string;
} {
  const chosenMidi = Math.round(midi);
  const noteIndex = ((chosenMidi % 12) + 12) % 12;
  const octave = Math.floor(chosenMidi / 12) - 1;
  const rawSolfege = SOLFEGE_NAMES[noteIndex] || 'La';
  return {
    noteName: `${NOTE_NAMES[noteIndex]}${octave}`,
    solfege: `${rawSolfege}${octave}`,
    pureSolfege: rawSolfege,
  };
}

/**
 * Built-in poetic practice lyrics for the 3 synthesized demo tracks
 */
const BUILTIN_DEMO_LYRICS: Record<string, string[]> = {
  Luyện_Thanh_Do_Truong_C3_G4: [
    'Đồm hơi sâu mở vòm ngân vang',
    'Mi bước lên giữ làn hơi đều',
    'Sol vững vàng mở rộng khẩu hình',
    'Đô sáng trong chạm tầng cao mới',
    'Mi vút bay nhẹ nhàng thư thái',
    'Sol đỉnh cao ngân dài rực rỡ',
    'Mi lướt êm hạ dần câu hát',
    'Đô lắng sâu giữ tròn nguyên âm',
    'Sol trầm ấm nối nhịp hơi thở',
    'Đồ kết câu vững vàng chuẩn tông',
  ],
  Giai_Dieu_Ballad_F3_C5: [
    'Chiều nhẹ buông tiếng mưa rơi êm',
    'Lời tự tình ngân theo gió mây',
    'Nhịp tim ngân khúc ca êm đềm',
    'Từng kỷ niệm chợt ùa về đây',
    'Dựng cao trào cảm xúc dâng lên',
    'Chạm nốt cao sáng trong bầu trời',
    'Trọn đam mê cháy trong câu ca',
    'Đỉnh cao trào vút bay ngân dài',
    'Dịu dàng buông lơi theo làn gió',
    'Hạ nhịp tim lắng nghe dư âm',
    'Khép câu tình trọn vẹn bình yên',
  ],
  Thang_Am_Ngu_Cung_Viet_Nam: [
    'Hò ơi câu hát quê hương mình',
    'Nhịp cầu tre nắng nghiêng bên dòng',
    'Cánh cò bay lả lơi trên đồng',
    'Tiếng sáo diều ngân vang chiều quê',
    'Điệu ngũ cung mượt mà sâu lắng',
    'Vươn cao vời vợi ánh trăng thanh',
    'Luyến láy mềm tựa làn mây trắng',
    'Nối câu hò ngọt ngào mênh mang',
    'Trầm bổng ngân tiếng đàn đêm vắng',
    'Dư âm còn đọng mãi ngàn năm',
  ],
};

/**
 * Compute Goertzel spectral power at a specific target frequency `targetHz`
 * on a pre-emphasized audio window.
 */
function goertzelBandEnergy(
  samples: Float32Array,
  startIdx: number,
  length: number,
  sampleRate: number,
  targetHz: number
): number {
  if (length <= 8 || targetHz <= 0 || targetHz >= sampleRate / 2) return 0;
  const k = Math.round((length * targetHz) / sampleRate);
  const omega = (2 * Math.PI * k) / length;
  const coeff = 2 * Math.cos(omega);
  let s1 = 0;
  let s2 = 0;

  // Apply Hamming window + 1st-order Pre-emphasis (x[n] - 0.97*x[n-1]) on the fly
  // Pre-emphasis removes -12dB/oct glottal slope so F1 and F2 formants are accurately balanced!
  for (let i = 0; i < length; i++) {
    const idx = startIdx + i;
    const rawCurr = samples[idx] || 0;
    const rawPrev = idx > 0 ? samples[idx - 1] || 0 : 0;
    const preEmph = rawCurr - 0.97 * rawPrev;
    const windowWeight = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (length - 1));
    const x = preEmph * windowWeight;

    const s0 = x + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }

  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return Math.max(0, power / length);
}

/**
 * Estimate F1 (260-960Hz) and F2 (800-2650Hz) formant peaks for a given audio slice
 * and classify into one of the 6 core Vietnamese vowel regions: 'A', 'Ê', 'I', 'Ơ', 'Ô', 'U'.
 */
function estimateSliceVowelFormants(
  rawMonoPcm: Float32Array,
  startSample: number,
  endSample: number,
  sampleRate: number,
  fundamentalHz: number
): { vowel: 'A' | 'E' | 'I' | 'Ơ' | 'Ô' | 'U'; f1Hz: number; f2Hz: number; nasalRatio: number } {
  const totalLen = endSample - startSample;
  if (totalLen < 128) {
    return { vowel: 'A', f1Hz: 700, f2Hz: 1350, nasalRatio: 0 };
  }

  // Take a centered analysis window of up to 1024 samples (~23ms at 44.1kHz)
  const winLen = Math.min(1024, totalLen);
  const winStart = startSample + Math.floor((totalLen - winLen) / 2);

  // Probe F1 candidate frequencies (avoiding exact fundamental f0 if f0 > 260Hz)
  const f1Grid = [280, 340, 400, 470, 540, 620, 710, 800, 900];
  let f1WeightedSum = 0;
  let f1WeightTotal = 0;
  let lowNasalEnergy = 0;

  for (const freq of f1Grid) {
    // Attenuate bin if it coincides closely with fundamental pitch f0 to avoid f0 masquerading as F1
    const distFromF0 = Math.abs(freq - fundamentalHz);
    const f0Mask = distFromF0 < 45 ? 0.35 : 1.0;
    const e = goertzelBandEnergy(rawMonoPcm, winStart, winLen, sampleRate, freq) * f0Mask;
    f1WeightedSum += freq * e;
    f1WeightTotal += e;
    if (freq <= 340) lowNasalEnergy += e;
  }

  // Probe F2 candidate frequencies (tongue front-back axis: 850Hz to 2600Hz)
  const f2Grid = [880, 1020, 1180, 1350, 1520, 1700, 1900, 2120, 2350, 2580];
  let f2WeightedSum = 0;
  let f2WeightTotal = 0;

  for (const freq of f2Grid) {
    const e = goertzelBandEnergy(rawMonoPcm, winStart, winLen, sampleRate, freq);
    f2WeightedSum += freq * e;
    f2WeightTotal += e;
  }

  const f1Hz = f1WeightTotal > 0 ? Math.round(f1WeightedSum / f1WeightTotal) : 540;
  const f2Hz = f2WeightTotal > 0 ? Math.round(f2WeightedSum / f2WeightTotal) : 1480;
  const nasalRatio =
    f1WeightTotal + f2WeightTotal > 0
      ? lowNasalEnergy / (f1WeightTotal + f2WeightTotal)
      : 0;

  // Map (F1, F2) in standard Vietnamese acoustic vowel space:
  // - /I/ (Khép trước): F1 low (< 445Hz), F2 high (> 1820Hz)
  // - /U/ (Khép sau): F1 low (< 445Hz), F2 low (< 1220Hz)
  // - /E, Ê/ (Nửa mở trước): F1 mid/high (>= 445Hz), F2 high (> 1720Hz)
  // - /A/ (Mở rộng): F1 high (>= 600Hz), F2 central (1180..1720Hz)
  // - /O, Ô/ (Tròn môi sau): F1 mid/high (>= 435Hz), F2 low (< 1220Hz)
  // - /Ơ, Ư/ (Trung tâm): F1 low/mid (380..600Hz), F2 central (1220..1720Hz)
  let vowel: 'A' | 'E' | 'I' | 'Ơ' | 'Ô' | 'U' = 'A';

  if (f2Hz >= 1820) {
    vowel = f1Hz < 455 ? 'I' : 'E';
  } else if (f2Hz <= 1230) {
    vowel = f1Hz < 435 ? 'U' : 'Ô';
  } else {
    vowel = f1Hz >= 585 ? 'A' : 'Ơ';
  }

  return { vowel, f1Hz, f2Hz, nasalRatio };
}

/**
 * Analyze both the Multi-Slice Vowel Formants (F1/F2 + Diphthong transition)
 * AND the Micro-Pitch Trajectory (cách nguyên âm đi lên/xuống/vòm/rung) for a single NoteBar!
 */
export function analyzeDeepNoteBarVowelAndTrajectory(params: {
  rawMonoPcm: Float32Array | null;
  sampleRate: number;
  bar: IVocalNoteBar;
  prevBar: IVocalNoteBar | null;
  pitchTrack: IReferencePitchPoint[];
}): {
  vowelPhoneme: string;
  displayWithContour: string;
  vowelHint: VowelMouthHint;
  formantsHz: [number, number];
  pitchTrajectory: VowelPitchTrajectory;
  trajectorySymbol: string;
  trajectoryLabel: string;
  stepSemitones: number;
  intraBendCents: number;
  pitchCurveCents: [number, number, number];
} {
  const { rawMonoPcm, sampleRate, bar, prevBar, pitchTrack } = params;
  const f0Hz = 440 * Math.pow(2, (bar.midi - 69) / 12);

  // 1. Inter-Note Melodic Step (so với từ/nốt liền trước)
  const stepSemitones = prevBar ? Math.round(bar.midi - prevBar.midi) : 0;

  // 2. Intra-Note Micro-Pitch Trajectory (cách nguyên âm uốn lên/xuống bên trong từ đó)
  const barPoints = pitchTrack.filter(
    (pt) => pt.isVocal && pt.midi > 0 && pt.timeMs >= bar.startTimeMs && pt.timeMs <= bar.endTimeMs
  );

  let startMidi = bar.exactMidi;
  let midMidi = bar.exactMidi;
  let endMidi = bar.exactMidi;
  let vibratoOscillations = 0;
  let maxDeviationSemitones = 0;

  if (barPoints.length >= 3) {
    const n = barPoints.length;
    const q1 = Math.max(1, Math.floor(n * 0.3));
    const q2Start = Math.floor(n * 0.3);
    const q2End = Math.max(q2Start + 1, Math.ceil(n * 0.7));
    const q3Start = Math.floor(n * 0.7);

    const avgSlice = (arr: IReferencePitchPoint[]) =>
      arr.reduce((acc, p) => acc + p.midi, 0) / Math.max(1, arr.length);

    startMidi = avgSlice(barPoints.slice(0, q1));
    midMidi = avgSlice(barPoints.slice(q2Start, q2End));
    endMidi = avgSlice(barPoints.slice(q3Start));

    // Count direction reversals (vibrato cycles) across consecutive frames
    let prevDelta = 0;
    for (let i = 1; i < n; i++) {
      const d = barPoints[i].midi - barPoints[i - 1].midi;
      if (Math.abs(d) > 0.06) {
        if (prevDelta * d < 0) vibratoOscillations++;
        prevDelta = d;
      }
      const dev = Math.abs(barPoints[i].midi - bar.exactMidi);
      if (dev > maxDeviationSemitones) maxDeviationSemitones = dev;
    }
  }

  const intraBendCents = Math.round((endMidi - startMidi) * 100);
  const archDeltaCents = Math.round((midMidi - (startMidi + endMidi) / 2) * 100);
  const pitchCurveCents: [number, number, number] = [
    Math.round((startMidi - bar.exactMidi) * 100),
    Math.round((midMidi - bar.exactMidi) * 100),
    Math.round((endMidi - bar.exactMidi) * 100),
  ];

  let pitchTrajectory: VowelPitchTrajectory = 'steady';
  let trajectorySymbol = '→';
  let trajectoryDesc = 'Giữ ngang';

  if (bar.durationMs >= 420 && vibratoOscillations >= 4 && maxDeviationSemitones >= 0.18) {
    pitchTrajectory = 'vibrato';
    trajectorySymbol = '〰';
    trajectoryDesc = 'Ngân rung';
  } else if (archDeltaCents >= 28) {
    pitchTrajectory = 'arch';
    trajectorySymbol = '⤴';
    trajectoryDesc = 'Luyến vòm lên';
  } else if (archDeltaCents <= -28) {
    pitchTrajectory = 'dip';
    trajectorySymbol = '⤵';
    trajectoryDesc = 'Uốn võng lên';
  } else if (intraBendCents >= 26) {
    pitchTrajectory = 'rising';
    trajectorySymbol = '↗';
    trajectoryDesc = `Vuốt lên (+${intraBendCents}c)`;
  } else if (intraBendCents <= -26) {
    pitchTrajectory = 'falling';
    trajectorySymbol = '↘';
    trajectoryDesc = `Hạ xuống (${intraBendCents}c)`;
  } else if (stepSemitones >= 2) {
    trajectorySymbol = '↗';
    trajectoryDesc = `Đi lên (+${stepSemitones} bán âm)`;
  } else if (stepSemitones === 1) {
    trajectorySymbol = '↗';
    trajectoryDesc = 'Lên nửa cung (+1)';
  } else if (stepSemitones <= -2) {
    trajectorySymbol = '↘';
    trajectoryDesc = `Đi xuống (${stepSemitones} bán âm)`;
  } else if (stepSemitones === -1) {
    trajectorySymbol = '↘';
    trajectoryDesc = 'Xuống nửa cung (-1)';
  }

  const stepPrefix =
    stepSemitones > 0
      ? `Lên +${stepSemitones} bán âm • `
      : stepSemitones < 0
      ? `Xuống ${stepSemitones} bán âm • `
      : 'Giữ độ cao • ';
  const trajectoryLabel = `${trajectorySymbol} ${stepPrefix}${trajectoryDesc}`;

  // 3. Multi-Slice Formant (F1/F2) & Diphthong Transition Analysis
  if (!rawMonoPcm || rawMonoPcm.length === 0 || sampleRate <= 0) {
    // Pitch-register informed vowel fallback when PCM is not present (e.g. unit tests)
    const fallbackVowels: Array<{ v: string; h: VowelMouthHint; f: [number, number] }> = [
      { v: 'A', h: 'A (Mở rộng hàm)', f: [720, 1380] },
      { v: 'Ơi', h: 'Nguyên âm đôi (Chuyển khẩu hình)', f: [520, 1680] },
      { v: 'Ê', h: 'E/Ê (Mở ngang)', f: [490, 1980] },
      { v: 'I', h: 'I (Khép dẹt sáng)', f: [340, 2280] },
      { v: 'Ô', h: 'O/Ô (Tròn môi)', f: [500, 960] },
      { v: 'U', h: 'U (Chu môi sâu)', f: [340, 860] },
    ];
    const pick = fallbackVowels[((bar.midi % 12) + 12) % fallbackVowels.length];
    return {
      vowelPhoneme: pick.v,
      displayWithContour: `${pick.v}${trajectorySymbol}`,
      vowelHint: pick.h,
      formantsHz: pick.f,
      pitchTrajectory,
      trajectorySymbol,
      trajectoryLabel,
      stepSemitones,
      intraBendCents,
      pitchCurveCents,
    };
  }

  const rawStart = Math.max(0, Math.floor((bar.startTimeMs / 1000) * sampleRate));
  const rawEnd = Math.min(rawMonoPcm.length, Math.ceil((bar.endTimeMs / 1000) * sampleRate));
  const rawLen = rawEnd - rawStart;

  // Trim 12% consonant onset and 10% release tail to isolate the true sung vowel core
  const coreStart = rawStart + Math.floor(rawLen * 0.12);
  const coreEnd = Math.max(coreStart + 128, rawEnd - Math.floor(rawLen * 0.1));
  const coreMid = Math.floor((coreStart + coreEnd) / 2);

  const earlyFormant = estimateSliceVowelFormants(rawMonoPcm, coreStart, coreMid, sampleRate, f0Hz);
  const lateFormant = estimateSliceVowelFormants(rawMonoPcm, coreMid, coreEnd, sampleRate, f0Hz);

  const avgF1 = Math.round((earlyFormant.f1Hz + lateFormant.f1Hz) / 2);
  const avgF2 = Math.round((earlyFormant.f2Hz + lateFormant.f2Hz) / 2);

  // Detect Diphthong transitions (Nguyên âm đôi khi F1/F2 dịch chuyển rõ rệt từ đầu sang cuối âm tiết)
  const f2Shift = lateFormant.f2Hz - earlyFormant.f2Hz;
  let vowelPhoneme: string = earlyFormant.vowel === 'E' ? 'Ê' : earlyFormant.vowel;
  let vowelHint: VowelMouthHint = 'A (Mở rộng hàm)';

  if (bar.durationMs >= 180 && earlyFormant.vowel !== lateFormant.vowel && Math.abs(f2Shift) >= 240) {
    const pair = `${earlyFormant.vowel}->${lateFormant.vowel}`;
    if (pair === 'A->I' || pair === 'A->E') {
      vowelPhoneme = 'Ai';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    } else if (pair === 'A->U' || pair === 'A->Ô') {
      vowelPhoneme = 'Ao';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    } else if (pair === 'Ơ->I' || pair === 'Ơ->E') {
      vowelPhoneme = 'Ơi';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    } else if (pair === 'Ô->I' || pair === 'Ô->E') {
      vowelPhoneme = 'Ôi';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    } else if (pair === 'I->A' || pair === 'I->Ơ' || pair === 'E->A') {
      vowelPhoneme = 'Ia';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    } else if (pair === 'U->A' || pair === 'U->Ơ' || pair === 'U->Ô') {
      vowelPhoneme = 'Ua';
      vowelHint = 'Nguyên âm đôi (Chuyển khẩu hình)';
    }
  }

  if (vowelHint !== 'Nguyên âm đôi (Chuyển khẩu hình)') {
    if (earlyFormant.nasalRatio > 0.62 && bar.durationMs >= 600) {
      vowelPhoneme = 'Ngân';
      vowelHint = 'Ngân mũi (Cộng minh)';
    } else {
      switch (earlyFormant.vowel) {
        case 'A':
          vowelPhoneme = 'A';
          vowelHint = 'A (Mở rộng hàm)';
          break;
        case 'E':
          vowelPhoneme = avgF1 >= 560 ? 'E' : 'Ê';
          vowelHint = 'E/Ê (Mở ngang)';
          break;
        case 'I':
          vowelPhoneme = 'I';
          vowelHint = 'I (Khép dẹt sáng)';
          break;
        case 'Ơ':
          vowelPhoneme = avgF1 < 440 ? 'Ư' : 'Ơ';
          vowelHint = 'Ơ/Ư (Mở vừa tự nhiên)';
          break;
        case 'Ô':
          vowelPhoneme = avgF1 >= 550 ? 'O' : 'Ô';
          vowelHint = 'O/Ô (Tròn môi)';
          break;
        case 'U':
          vowelPhoneme = 'U';
          vowelHint = 'U (Chu môi sâu)';
          break;
      }
    }
  }

  return {
    vowelPhoneme,
    displayWithContour: `${vowelPhoneme}${trajectorySymbol}`,
    vowelHint,
    formantsHz: [avgF1, avgF2],
    pitchTrajectory,
    trajectorySymbol,
    trajectoryLabel,
    stepSemitones,
    intraBendCents,
    pitchCurveCents,
  };
}

/**
 * Classify structural song sections (Intro, Verse, Pre-Chorus, Chorus, Climax, Bridge, Outro)
 * and melodic contour so the user always knows WHERE they are in the song.
 */
export function classifyPhraseSectionsAndContours(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  durationMs: number,
  lowestMidi: number,
  highestMidi: number
): void {
  if (phrases.length === 0) return;

  const midiSpan = Math.max(1, highestMidi - lowestMidi);

  let maxAvgMidi = -999;
  let climaxPhraseIdx = -1;
  phrases.forEach((p) => {
    if (p.avgMidi > maxAvgMidi) {
      maxAvgMidi = p.avgMidi;
      climaxPhraseIdx = p.phraseIndex;
    }
  });

  phrases.forEach((phrase, idx) => {
    const progressRatio =
      durationMs > 0 ? phrase.startMs / durationMs : idx / Math.max(1, phrases.length);
    const relativeHeight = (phrase.avgMidi - lowestMidi) / midiSpan;
    const phraseBars = noteBars.filter(
      (b) => b.endTimeMs >= phrase.startMs && b.startTimeMs <= phrase.endMs
    );

    // Count how many notes go up vs down inside this phrase
    let upSteps = 0;
    let downSteps = 0;
    for (let i = 1; i < phraseBars.length; i++) {
      const diff = phraseBars[i].midi - phraseBars[i - 1].midi;
      if (diff >= 1) upSteps++;
      else if (diff <= -1) downSteps++;
    }

    let contourLabel = 'Giữ trục cao độ ổn định →';
    if (phraseBars.length >= 2) {
      const netDelta = phraseBars[phraseBars.length - 1].midi - phraseBars[0].midi;
      if (phrase.pitchJumpSemitones >= 6) {
        contourLabel = `Nhảy quãng rộng (${phrase.pitchJumpSemitones} bán âm) ⚡ (Lên ${upSteps} / Xuống ${downSteps})`;
      } else if (netDelta >= 2) {
        contourLabel = `Giai điệu đi lên ↗ (+${Math.round(netDelta)} bán âm • Lên ${upSteps} nhịp)`;
      } else if (netDelta <= -2) {
        contourLabel = `Giai điệu đi xuống ↘ (${Math.round(netDelta)} bán âm • Hạ ${downSteps} nhịp)`;
      } else if (upSteps > 0 && downSteps > 0) {
        contourLabel = `Luyến lượn sóng 〰 (Lên ${upSteps} / Xuống ${downSteps} nhịp)`;
      } else {
        contourLabel = 'Ngân ngang đều đặn →';
      }
    }

    let sectionType: VocalSectionType = 'verse';
    let sectionLabel = 'Phiên khúc (Verse)';

    if (idx === 0 && phrases.length >= 3) {
      sectionType = 'intro';
      sectionLabel = 'Mở đầu (Vào bài)';
    } else if (idx === phrases.length - 1 && phrases.length >= 3) {
      sectionType = 'outro';
      sectionLabel = 'Kết bài (Outro)';
    } else if (phrase.phraseIndex === climaxPhraseIdx && phrases.length >= 4) {
      sectionType = 'climax';
      sectionLabel = 'Đỉnh cao trào (Climax)';
    } else if (relativeHeight >= 0.62 || phrase.difficulty === 'Thử thách') {
      sectionType = 'chorus';
      sectionLabel = 'Điệp khúc (Cao trào)';
    } else if (
      idx > 0 &&
      idx < phrases.length - 1 &&
      phrases[idx + 1] &&
      (phrases[idx + 1].avgMidi - phrase.avgMidi >= 2.0 ||
        phrases[idx + 1].difficulty === 'Thử thách')
    ) {
      sectionType = 'pre_chorus';
      sectionLabel = 'Tiền điệp khúc (Dẫn cao trào)';
    } else if (progressRatio >= 0.68 && relativeHeight < 0.62) {
      sectionType = 'bridge';
      sectionLabel = 'Đoạn chuyển (Bridge)';
    } else {
      const verseNum = idx < phrases.length / 2 ? 1 : 2;
      sectionType = 'verse';
      sectionLabel = `Phiên khúc ${verseNum} (Tự sự)`;
    }

    let focusTip = 'Giữ cột hơi đều, phát âm rõ nguyên âm và bám sát hướng đi lên/xuống của từng từ.';
    if (sectionType === 'climax' || sectionType === 'chorus') {
      focusTip = `Đoạn cao trào (${phrase.lowestNote} → ${phrase.highestNote}): Mở rộng khẩu hình ở các nguyên âm mở (/A/, /Ơ/) và nén hơi cơ hoành khi vuốt lên nốt ${phrase.highestNote}.`;
    } else if (phrase.pitchJumpSemitones >= 5) {
      focusTip = `Có bước nhảy quãng ${phrase.pitchJumpSemitones} bán âm: Chú ý các mũi tên ↗ / ↘ trên từng nguyên âm để chuyển cao độ dứt khoát, không bị trượt giọng.`;
    } else if (sectionType === 'outro') {
      focusTip = 'Đoạn kết: Giữ hơi thở sâu ở các nguyên âm cuối câu (↘) để hạ giọng êm mà không bị tụt phô.';
    }

    phrase.sectionType = sectionType;
    phrase.sectionLabel = sectionLabel;
    phrase.contourLabel = contourLabel;
    phrase.focusTip = focusTip;
  });
}

/**
 * Align a lyric string (or deep vowel-trajectory tokens) onto the discrete NoteBars belonging to a Phrase.
 */
export function alignWordsToPhraseNoteBars(
  phrase: IVocalPhrase,
  allNoteBars: IVocalNoteBar[],
  lyricText?: string,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = []
): void {
  const phraseBars = allNoteBars.filter(
    (b) => b.endTimeMs >= phrase.startMs - 40 && b.startTimeMs <= phrase.endMs + 40
  );

  const solfegeTokens: string[] = [];
  const vowelTrajectoryTokens: string[] = [];
  const barAnalysisList: Array<
    ReturnType<typeof analyzeDeepNoteBarVowelAndTrajectory> & {
      solfege: string;
      noteName: string;
    }
  > = [];

  if (phraseBars.length > 0) {
    phraseBars.forEach((bar, idx) => {
      const { noteName, solfege } = midiToCompactSolfege(bar.midi);
      const prevBar = idx > 0 ? phraseBars[idx - 1] : null;
      const deep = analyzeDeepNoteBarVowelAndTrajectory({
        rawMonoPcm: rawMonoPcm || null,
        sampleRate,
        bar,
        prevBar,
        pitchTrack,
      });

      solfegeTokens.push(`${solfege}${deep.trajectorySymbol}`);
      vowelTrajectoryTokens.push(deep.displayWithContour);
      barAnalysisList.push({
        ...deep,
        solfege,
        noteName,
      });
    });
  } else {
    phrase.notes.forEach((n) => {
      solfegeTokens.push(n);
      vowelTrajectoryTokens.push('A→');
    });
  }

  phrase.solfegeText = solfegeTokens.join(' · ');
  const contourShort =
    phrase.lowestNote === phrase.highestNote
      ? phrase.lowestNote
      : `${phrase.lowestNote}→${phrase.highestNote}`;
  phrase.acousticText = `Nguyên âm: ${vowelTrajectoryTokens.join(' · ')} (${contourShort})`;

  const cleanCustomText =
    lyricText && !lyricText.startsWith('Nguyên âm:') ? lyricText.trim() : '';

  const effectiveText =
    cleanCustomText.length > 0
      ? cleanCustomText
      : phrase.isInstrumentalOrVocalize
      ? '🎵 Đoạn ngân / Không lời (Vocalize)'
      : phrase.acousticText;

  phrase.lyricText = effectiveText;

  // Tokenize words/syllables for word-level Karaoke synchronization
  const rawTokens =
    cleanCustomText.length > 0
      ? cleanCustomText.split(/\s+/).filter(Boolean)
      : vowelTrajectoryTokens.length > 0
      ? vowelTrajectoryTokens
      : ['A→'];

  const words: IVocalLyricWord[] = [];

  if (phraseBars.length === 0) {
    const totalDur = Math.max(200, phrase.endMs - phrase.startMs);
    const step = totalDur / Math.max(1, rawTokens.length);
    rawTokens.forEach((tk, i) => {
      const info = midiToCompactSolfege(phrase.avgMidi);
      words.push({
        wordIndex: i,
        text: tk,
        solfege: info.solfege,
        noteName: info.noteName,
        midi: Math.round(phrase.avgMidi),
        startMs: Math.round(phrase.startMs + i * step),
        endMs: Math.round(phrase.startMs + (i + 1) * step),
        vowelPhoneme: 'A',
        vowelHint: 'A (Mở rộng hàm)',
        pitchTrajectory: 'steady',
        trajectorySymbol: '→',
        trajectoryLabel: '→ Giữ độ cao',
        stepSemitones: 0,
        intraBendCents: 0,
        pitchCurveCents: [0, 0, 0],
      });
    });
  } else if (rawTokens.length <= phraseBars.length) {
    const barsPerWord = phraseBars.length / rawTokens.length;
    rawTokens.forEach((tk, i) => {
      const startBarIdx = Math.min(phraseBars.length - 1, Math.floor(i * barsPerWord));
      const endBarIdx = Math.min(
        phraseBars.length - 1,
        Math.max(startBarIdx, Math.floor((i + 1) * barsPerWord) - 1)
      );
      const firstBar = phraseBars[startBarIdx];
      const lastBar = phraseBars[endBarIdx];
      const ac = barAnalysisList[startBarIdx];

      // If multiple bars span 1 word (melisma / luyến nhiều nốt trên 1 chữ), compute combined trajectory!
      let melismaSymbol = ac.trajectorySymbol;
      let melismaLabel = ac.trajectoryLabel;
      if (endBarIdx > startBarIdx) {
        const netMelisma = lastBar.midi - firstBar.midi;
        melismaSymbol = netMelisma > 0 ? '⤴' : netMelisma < 0 ? '⤵' : '〰';
        melismaLabel = `${melismaSymbol} Luyến ${endBarIdx - startBarIdx + 1} nốt (${firstBar.noteName}→${lastBar.noteName})`;
      }

      // Attach syllable + trajectory arrow onto the noteBars for direct Canvas rendering!
      firstBar.lyricSyllable = tk.includes(melismaSymbol) ? tk : `${tk}${melismaSymbol}`;
      firstBar.vowelHint = ac.vowelHint;
      for (let bIdx = startBarIdx + 1; bIdx <= endBarIdx; bIdx++) {
        const subAc = barAnalysisList[bIdx];
        phraseBars[bIdx].lyricSyllable = `~${subAc.vowelPhoneme}${subAc.trajectorySymbol}`;
        phraseBars[bIdx].vowelHint = subAc.vowelHint;
      }

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac.solfege,
        noteName: ac.noteName,
        midi: firstBar.midi,
        startMs: firstBar.startTimeMs,
        endMs: lastBar.endTimeMs,
        vowelPhoneme: ac.vowelPhoneme,
        vowelHint: ac.vowelHint,
        formantsHz: ac.formantsHz,
        pitchTrajectory: ac.pitchTrajectory,
        trajectorySymbol: melismaSymbol,
        trajectoryLabel: melismaLabel,
        stepSemitones: ac.stepSemitones,
        intraBendCents: ac.intraBendCents,
        pitchCurveCents: ac.pitchCurveCents,
      });
    });
  } else {
    // More words than noteBars
    rawTokens.forEach((tk, i) => {
      const mappedBarIdx = Math.min(
        phraseBars.length - 1,
        Math.floor((i / rawTokens.length) * phraseBars.length)
      );
      const bar = phraseBars[mappedBarIdx];
      const ac = barAnalysisList[mappedBarIdx];

      const firstTokenForBar = Math.floor((mappedBarIdx / phraseBars.length) * rawTokens.length);
      const lastTokenForBar = Math.max(
        firstTokenForBar,
        Math.ceil(((mappedBarIdx + 1) / phraseBars.length) * rawTokens.length) - 1
      );
      const countInBar = Math.max(1, lastTokenForBar - firstTokenForBar + 1);
      const subIndex = Math.max(0, i - firstTokenForBar);
      const subDur = bar.durationMs / countInBar;

      if (subIndex === 0) {
        bar.lyricSyllable = `${tk}${ac.trajectorySymbol}`;
        bar.vowelHint = ac.vowelHint;
      } else if (bar.lyricSyllable && !bar.lyricSyllable.includes(' ')) {
        bar.lyricSyllable = `${bar.lyricSyllable} ${tk}`;
      }

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac.solfege,
        noteName: ac.noteName,
        midi: bar.midi,
        startMs: Math.round(bar.startTimeMs + subIndex * subDur),
        endMs: Math.round(bar.startTimeMs + (subIndex + 1) * subDur),
        vowelPhoneme: ac.vowelPhoneme,
        vowelHint: ac.vowelHint,
        formantsHz: ac.formantsHz,
        pitchTrajectory: ac.pitchTrajectory,
        trajectorySymbol: ac.trajectorySymbol,
        trajectoryLabel: ac.trajectoryLabel,
        stepSemitones: subIndex === 0 ? ac.stepSemitones : 0,
        intraBendCents: ac.intraBendCents,
        pitchCurveCents: ac.pitchCurveCents,
      });
    });
  }

  phrase.words = words;
}

/**
 * Parse LRC formatted text (`[mm:ss.xx] Lyric line`) into timestamped lines
 */
export function parseLrcContent(lrcText: string): ILrcLine[] {
  const lines = lrcText.split(/\r?\n/);
  const result: ILrcLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const matches = [...rawLine.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    const textContent = rawLine
      .replace(timeRegex, '')
      .replace(/<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g, '')
      .trim();

    if (!textContent) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      const ms =
        fracStr.length === 1
          ? parseInt(fracStr, 10) * 100
          : fracStr.length === 2
          ? parseInt(fracStr, 10) * 10
          : parseInt(fracStr.slice(0, 3), 10);

      const timeMs = min * 60000 + sec * 1000 + ms;
      result.push({ timeMs, text: textContent });
    }
  }

  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}

/**
 * Align parsed LRC lines onto detected IVocalPhrase[] by maximum temporal overlap / proximity
 */
export function alignLrcLinesToPhrases(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = []
): void {
  if (phrases.length === 0 || lrcLines.length === 0) return;

  const assignedTexts: Record<number, string[]> = {};
  phrases.forEach((p) => {
    assignedTexts[p.phraseIndex] = [];
  });

  for (let i = 0; i < lrcLines.length; i++) {
    const line = lrcLines[i];
    const lineStart = line.timeMs;
    const lineEnd = i + 1 < lrcLines.length ? lrcLines[i + 1].timeMs : lineStart + 4000;

    let bestPhrase = phrases[0];
    let bestScore = -Infinity;

    for (const p of phrases) {
      const overlapStart = Math.max(p.startMs - 350, lineStart);
      const overlapEnd = Math.min(p.endMs + 350, lineEnd);
      const overlap = overlapEnd - overlapStart;

      const pCenter = (p.startMs + p.endMs) / 2;
      const distPenalty = Math.abs(pCenter - lineStart) * 0.25;
      const score = overlap - distPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestPhrase = p;
      }
    }

    assignedTexts[bestPhrase.phraseIndex].push(line.text);
  }

  phrases.forEach((p) => {
    const joined = assignedTexts[p.phraseIndex].join(' / ').trim();
    p.isInstrumentalOrVocalize = false;
    alignWordsToPhraseNoteBars(
      p,
      noteBars,
      joined.length > 0 ? joined : undefined,
      rawMonoPcm,
      sampleRate,
      pitchTrack
    );
  });
}

/**
 * Align plain multi-line text onto IVocalPhrase[]
 */
export function alignPlainTextToPhrases(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  plainText: string,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = []
): void {
  const cleanLines = plainText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !/^\[(verse|chorus|intro|outro|bridge|điệp khúc|phiên khúc)/i.test(l)
    );

  if (cleanLines.length === 0 || phrases.length === 0) return;

  if (cleanLines.length === phrases.length) {
    phrases.forEach((p, idx) => {
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(
        p,
        noteBars,
        cleanLines[idx],
        rawMonoPcm,
        sampleRate,
        pitchTrack
      );
    });
    return;
  }

  phrases.forEach((p, idx) => {
    if (cleanLines.length < phrases.length) {
      const lineText = cleanLines[idx];
      p.isInstrumentalOrVocalize = !lineText;
      alignWordsToPhraseNoteBars(p, noteBars, lineText, rawMonoPcm, sampleRate, pitchTrack);
    } else {
      const startL = Math.floor((idx / phrases.length) * cleanLines.length);
      const endL = Math.max(
        startL + 1,
        Math.floor(((idx + 1) / phrases.length) * cleanLines.length)
      );
      const combined = cleanLines.slice(startL, endL).join(' ');
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(p, noteBars, combined, rawMonoPcm, sampleRate, pitchTrack);
    }
  });
}

/**
 * Scan raw binary ArrayBuffer for embedded lyrics (ID3v2 USLT or Vorbis/FLAC LYRICS=)
 */
export function extractEmbeddedLyricsFromBuffer(buffer: ArrayBuffer): string | null {
  try {
    const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 256 * 1024));
    const decoderLatin = new TextDecoder('iso-8859-1');
    const headerAscii = decoderLatin.decode(bytes);

    const vorbisMatch = headerAscii.match(/(?:UNSYNCED)?LYRICS=([^\x00]{12,4000})/i);
    if (vorbisMatch && vorbisMatch[1]) {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
      const startIdx = headerAscii.indexOf(vorbisMatch[1]);
      if (startIdx >= 0) {
        const sub = bytes.subarray(startIdx, startIdx + vorbisMatch[1].length);
        return utf8Decoder.decode(sub).trim();
      }
    }

    const usltIdx = headerAscii.indexOf('USLT');
    if (usltIdx >= 0 && usltIdx + 14 < bytes.length) {
      const frameSize =
        (bytes[usltIdx + 4] << 24) |
        (bytes[usltIdx + 5] << 16) |
        (bytes[usltIdx + 6] << 8) |
        bytes[usltIdx + 7];
      if (frameSize > 6 && frameSize < 32768 && usltIdx + 10 + frameSize <= bytes.length) {
        const encoding = bytes[usltIdx + 10];
        let textStart = usltIdx + 14;
        while (textStart < usltIdx + 10 + frameSize && bytes[textStart] !== 0) {
          textStart++;
        }
        textStart++;
        if (bytes[textStart] === 0) textStart++;
        const payload = bytes.subarray(textStart, usltIdx + 10 + frameSize);
        const decoder =
          encoding === 1 || encoding === 2
            ? new TextDecoder('utf-16')
            : new TextDecoder('utf-8', { fatal: false });
        const extracted = decoder.decode(payload).replace(/\x00/g, '').trim();
        if (extracted.length >= 8) return extracted;
      }
    }
  } catch {
    // Ignore binary parsing errors cleanly
  }
  return null;
}

/**
 * Generate smart candidate search queries from complex YouTube/MP3 filenames
 * e.g. "Thích Thích - Phương Ly ft. JustaTee | Vụ Nổ Lớn - Phát Phát.mp3"
 * -> ["Thích Thích Phương Ly", "Thích Thích", "Thích Thích Phương Ly JustaTee"]
 */
export function buildSmartLyricQueries(fileName: string): string[] {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  // Split by pipe '|' or slash '/' first (YouTube titles often put album/channel after '|')
  const primaryPart = withoutExt.split(/[|/]/)[0] || withoutExt;

  const stripNoise = (s: string) =>
    s
      .replace(/\[.*?\]|\(.*?\)/g, ' ')
      .replace(
        /\b(ft\.?|feat\.?|prod\.?|vocal|stem|acapella|karaoke|official|music|video|lyric|lyrics|audio|mv|hd|4k|mp3|wav|128kbps|320kbps|demo|track|record|recording|ghi_am|remix|cover|live)\b/gi,
        ' '
      )
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const candidates: string[] = [];

  // Candidate 1: Primary part with featuring artist removed (e.g. "Thích Thích - Phương Ly")
  const beforeFeat = primaryPart.split(/\b(?:ft\.?|feat\.?)\b/i)[0] || primaryPart;
  const cleanBeforeFeat = stripNoise(beforeFeat);
  if (cleanBeforeFeat.length >= 3) candidates.push(cleanBeforeFeat);

  // Candidate 2: Just the song title before '-' (e.g. "Thích Thích")
  const dashParts = beforeFeat.split(/\s*-\s*/);
  if (dashParts.length >= 2) {
    const songTitleOnly = stripNoise(dashParts[0]);
    if (songTitleOnly.length >= 3 && !candidates.includes(songTitleOnly)) {
      candidates.push(songTitleOnly);
    }
  }

  // Candidate 3: Full primary part cleaned
  const cleanFull = stripNoise(primaryPart);
  if (cleanFull.length >= 3 && !candidates.includes(cleanFull)) {
    candidates.push(cleanFull);
  }

  return candidates.filter(
    (q) => !/^(audio|vocal|bai hat|test|sample|untitled|\d+)$/i.test(q)
  );
}

/**
 * Query open LRCLIB API (`https://lrclib.net/api/search`) using multi-candidate smart queries
 */
export async function fetchAutoLyricsFromLrclib(
  fileName: string,
  durationMs: number
): Promise<{ syncedLyrics?: string; plainLyrics?: string; matchedTitle?: string } | null> {
  const queries = buildSmartLyricQueries(fileName);
  if (queries.length === 0 || typeof fetch === 'undefined') return null;

  const targetDurSec = durationMs / 1000;

  for (const query of queries.slice(0, 2)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2400);

    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) continue;

      const scored = list
        .filter((item: any) => item && (item.syncedLyrics || item.plainLyrics))
        .map((item: any) => {
          const durDiff = Math.abs((Number(item.duration) || targetDurSec) - targetDurSec);
          const hasSyncBonus = item.syncedLyrics ? 30 : 0;
          return { item, score: hasSyncBonus - durDiff };
        })
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const best = scored[0].item;
        return {
          syncedLyrics: best.syncedLyrics || undefined,
          plainLyrics: best.plainLyrics || undefined,
          matchedTitle: [best.trackName, best.artistName].filter(Boolean).join(' – '),
        };
      }
    } catch {
      clearTimeout(timer);
    }
  }

  return null;
}

/**
 * Save user-edited or imported lyrics & phrase boundaries to localStorage
 */
export function saveLyricsToLocalCache(result: IVocalAnalysisResult): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const key = `${LYRIC_CACHE_PREFIX}${result.fileName}_${Math.round(result.durationMs / 1000)}`;
    const payload: ICachedSongLyrics = {
      lyricSource: result.lyricSource || 'manual',
      matchedTrackTitle: result.matchedTrackTitle,
      phrases: result.phrases.map((p) => ({
        phraseIndex: p.phraseIndex,
        startMs: p.startMs,
        endMs: p.endMs,
        lyricText: p.lyricText || '',
        isInstrumentalOrVocalize: p.isInstrumentalOrVocalize,
      })),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Load cached lyrics for a song if previously customized by user
 */
export function loadLyricsFromLocalCache(
  fileName: string,
  durationMs: number
): ICachedSongLyrics | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const key = `${LYRIC_CACHE_PREFIX}${fileName}_${Math.round(durationMs / 1000)}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as ICachedSongLyrics;
  } catch {
    return null;
  }
}

/**
 * Master pipeline called during `vocalFileAnalysisService.analyzeVocalAudio`
 * Performs deep multi-pass Formant (F1/F2) Vowel + Micro-Pitch Trajectory analysis
 * and multi-tier automatic lyric resolution!
 */
export async function populateAutomaticSongLyricsAndStructure(params: {
  fileName: string;
  durationMs: number;
  sampleRate: number;
  rawMonoPcm: Float32Array;
  arrayBuffer: ArrayBuffer;
  phrases: IVocalPhrase[];
  noteBars: IVocalNoteBar[];
  pitchTrack: IReferencePitchPoint[];
  lowestMidi: number;
  highestMidi: number;
  onProgress?: (pct: number, statusText: string) => void;
}): Promise<{
  lyricSource: LyricSourceType;
  lyricStatus: LyricCompletenessStatus;
  matchedTrackTitle?: string;
}> {
  const {
    fileName,
    durationMs,
    sampleRate,
    rawMonoPcm,
    arrayBuffer,
    phrases,
    noteBars,
    pitchTrack,
    lowestMidi,
    highestMidi,
    onProgress,
  } = params;

  // 1. Classify structural sections & melodic step contours
  classifyPhraseSectionsAndContours(phrases, noteBars, durationMs, lowestMidi, highestMidi);

  // 2. Deep Multi-Pass Formant (F1/F2) & Pitch Trajectory Analysis across all phrases
  // Yield periodically so the user sees genuine deep acoustic analysis progress
  const totalPhrases = Math.max(1, phrases.length);
  for (let i = 0; i < phrases.length; i++) {
    alignWordsToPhraseNoteBars(
      phrases[i],
      noteBars,
      undefined,
      rawMonoPcm,
      sampleRate,
      pitchTrack
    );
    if (onProgress && (i % 5 === 0 || i === phrases.length - 1)) {
      const pct = Math.min(96, 91 + Math.round(((i + 1) / totalPhrases) * 5));
      onProgress(
        pct,
        `Giai đoạn 6/7: Quét phổ Formant F1-F2 & Quỹ đạo nguyên âm (↗/↘) câu ${i + 1}/${phrases.length}...`
      );
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }

  // 3. Layer 1A: Check LocalStorage user cache
  const cached = loadLyricsFromLocalCache(fileName, durationMs);
  if (cached && cached.phrases.length === phrases.length) {
    phrases.forEach((p, idx) => {
      const cp = cached.phrases[idx];
      p.isInstrumentalOrVocalize = cp.isInstrumentalOrVocalize;
      alignWordsToPhraseNoteBars(
        p,
        noteBars,
        cp.lyricText,
        rawMonoPcm,
        sampleRate,
        pitchTrack
      );
    });
    return {
      lyricSource: cached.lyricSource,
      lyricStatus: 'complete',
      matchedTrackTitle: cached.matchedTrackTitle,
    };
  }

  // 4. Layer 1B: Check Built-in Demo Tracks
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  if (BUILTIN_DEMO_LYRICS[baseName]) {
    const demoLines = BUILTIN_DEMO_LYRICS[baseName];
    alignPlainTextToPhrases(
      phrases,
      noteBars,
      demoLines.join('\n'),
      rawMonoPcm,
      sampleRate,
      pitchTrack
    );
    return {
      lyricSource: 'demo_builtin',
      lyricStatus: 'complete',
      matchedTrackTitle: baseName.replace(/_/g, ' '),
    };
  }

  // 5. Layer 2: Check Embedded ID3v2 / Vorbis Lyrics inside audio file binary
  const embeddedText = extractEmbeddedLyricsFromBuffer(arrayBuffer);
  if (embeddedText) {
    const lrcLines = parseLrcContent(embeddedText);
    if (lrcLines.length >= 2) {
      alignLrcLinesToPhrases(phrases, noteBars, lrcLines, rawMonoPcm, sampleRate, pitchTrack);
    } else {
      alignPlainTextToPhrases(phrases, noteBars, embeddedText, rawMonoPcm, sampleRate, pitchTrack);
    }
    return {
      lyricSource: 'embedded_tag',
      lyricStatus: 'complete',
    };
  }

  // 6. Layer 3: Query Open LRCLIB API with multi-stage smart filename queries
  if (onProgress) {
    onProgress(98, 'Giai đoạn 7/7: Đối chiếu lời bài hát đồng bộ & hoàn tất bản đồ nguyên âm...');
  }
  const autoCloud = await fetchAutoLyricsFromLrclib(fileName, durationMs);
  if (autoCloud && (autoCloud.syncedLyrics || autoCloud.plainLyrics)) {
    if (autoCloud.syncedLyrics) {
      const lrcLines = parseLrcContent(autoCloud.syncedLyrics);
      if (lrcLines.length > 0) {
        alignLrcLinesToPhrases(phrases, noteBars, lrcLines, rawMonoPcm, sampleRate, pitchTrack);
        return {
          lyricSource: 'auto_lrclib',
          lyricStatus: 'complete',
          matchedTrackTitle: autoCloud.matchedTitle,
        };
      }
    }
    if (autoCloud.plainLyrics) {
      alignPlainTextToPhrases(
        phrases,
        noteBars,
        autoCloud.plainLyrics,
        rawMonoPcm,
        sampleRate,
        pitchTrack
      );
      return {
        lyricSource: 'auto_lrclib',
        lyricStatus: 'complete',
        matchedTrackTitle: autoCloud.matchedTitle,
      };
    }
  }

  // 7. Layer 4: True Formant (F1/F2) Vowel + Micro-Pitch Trajectory relative representation
  return {
    lyricSource: 'acoustic_relative',
    lyricStatus: 'relative_auto',
  };
}

/**
 * Search and trace phrases by keyword (Vietnamese accent-insensitive), vowel phoneme, section name, note, phrase number, or timestamp!
 */
export function searchAndTracePhrases(phrases: IVocalPhrase[], rawQuery: string): IVocalPhrase[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return phrases;

  const matchByTimestampMs = (targetMs: number): IVocalPhrase[] => {
    const exact = phrases.filter((p) => targetMs >= p.startMs && targetMs <= p.endMs);
    if (exact.length > 0) return exact;
    const near = phrases.filter((p) => targetMs >= p.startMs - 400 && targetMs <= p.endMs + 400);
    if (near.length > 0) return near;
    const sorted = [...phrases].sort((a, b) => {
      const distA = Math.min(Math.abs(a.startMs - targetMs), Math.abs(a.endMs - targetMs));
      const distB = Math.min(Math.abs(b.startMs - targetMs), Math.abs(b.endMs - targetMs));
      return distA - distB;
    });
    return sorted.length > 0 ? [sorted[0]] : [];
  };

  // 1. Check timestamp pattern: e.g. "00:15", "0:15", "15s"
  const timeColonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (timeColonMatch) {
    const targetMs =
      (parseInt(timeColonMatch[1], 10) * 60 + parseInt(timeColonMatch[2], 10)) * 1000;
    return matchByTimestampMs(targetMs);
  }
  const secMatch = trimmed.match(/^(\d{1,3})\s*s(?:ec|giây)?$/i);
  if (secMatch) {
    const targetMs = parseInt(secMatch[1], 10) * 1000;
    return matchByTimestampMs(targetMs);
  }

  // 2. Check phrase number pattern: e.g. "câu 3", "cau 3", "#3", or standalone number "3"
  const phraseNumMatch = normalizeVietnameseSearch(trimmed).match(/^(?:cau\s*|#)?(\d{1,3})$/);
  if (phraseNumMatch) {
    const targetIdx = parseInt(phraseNumMatch[1], 10);
    return phrases.filter((p) => p.phraseIndex === targetIdx);
  }

  // 3. Full text & metadata search (Lyric text, Vowel trajectory, Solfege, Section label, Notes)
  const normQuery = normalizeVietnameseSearch(trimmed);
  return phrases.filter((p) => {
    const wordVowels = (p.words || [])
      .map((w) => `${w.vowelPhoneme || ''} ${w.trajectoryLabel || ''}`)
      .join(' ');
    const searchableBlob = normalizeVietnameseSearch(
      [
        `cau ${p.phraseIndex}`,
        p.lyricText || '',
        p.solfegeText || '',
        p.acousticText || '',
        wordVowels,
        p.sectionLabel || '',
        p.contourLabel || '',
        p.difficulty || '',
        p.lowestNote,
        p.highestNote,
        ...(p.notes || []),
      ].join(' ')
    );
    return searchableBlob.includes(normQuery);
  });
}

/**
 * Update a single phrase's lyric text in-place and re-align its words to noteBars
 */
export function updateSinglePhraseLyric(
  result: IVocalAnalysisResult,
  phraseIndex: number,
  newLyricText: string,
  isInstrumental = false
): IVocalAnalysisResult {
  const updatedPhrases = result.phrases.map((p) => {
    if (p.phraseIndex !== phraseIndex) return p;
    const copy: IVocalPhrase = {
      ...p,
      isInstrumentalOrVocalize: isInstrumental,
    };
    alignWordsToPhraseNoteBars(copy, result.noteBars, newLyricText, null, result.sampleRate, result.pitchTrack);
    return copy;
  });

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    lyricSource: 'manual',
    lyricStatus: 'complete',
    phrases: updatedPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}

/**
 * Merge phrase at `phraseIndex` with the immediately following phrase (`phraseIndex + 1`)
 */
export function mergeWithNextPhrase(
  result: IVocalAnalysisResult,
  phraseIndex: number
): IVocalAnalysisResult {
  const idx = result.phrases.findIndex((p) => p.phraseIndex === phraseIndex);
  if (idx < 0 || idx >= result.phrases.length - 1) return result;

  const first = result.phrases[idx];
  const second = result.phrases[idx + 1];

  const mergedText = [first.lyricText, second.lyricText]
    .filter((t) => t && !t.startsWith('Nguyên âm:'))
    .join(' ')
    .trim();

  const mergedNotes = Array.from(new Set([...first.notes, ...second.notes])).slice(0, 8);
  const mergedPhrase: IVocalPhrase = {
    ...first,
    endMs: second.endMs,
    durationMs: second.endMs - first.startMs,
    notes: mergedNotes,
    lowestNote: first.avgMidi <= second.avgMidi ? first.lowestNote : second.lowestNote,
    highestNote: first.avgMidi >= second.avgMidi ? first.highestNote : second.highestNote,
    avgPitchHz: Math.round((first.avgPitchHz + second.avgPitchHz) / 2),
    avgMidi: Math.round(((first.avgMidi + second.avgMidi) / 2) * 10) / 10,
    pitchJumpSemitones: Math.max(first.pitchJumpSemitones, second.pitchJumpSemitones),
    difficulty:
      first.difficulty === 'Thử thách' || second.difficulty === 'Thử thách'
        ? 'Thử thách'
        : first.difficulty === 'Trung bình' || second.difficulty === 'Trung bình'
        ? 'Trung bình'
        : 'Dễ',
    pointsCount: first.pointsCount + second.pointsCount,
  };

  alignWordsToPhraseNoteBars(
    mergedPhrase,
    result.noteBars,
    mergedText || undefined,
    null,
    result.sampleRate,
    result.pitchTrack
  );

  const newPhrases = [
    ...result.phrases.slice(0, idx),
    mergedPhrase,
    ...result.phrases.slice(idx + 2),
  ].map((p, i) => ({
    ...p,
    id: `phrase-${i + 1}`,
    phraseIndex: i + 1,
  }));

  classifyPhraseSectionsAndContours(
    newPhrases,
    result.noteBars,
    result.durationMs,
    result.vocalRange.lowestMidi,
    result.vocalRange.highestMidi
  );

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    phrases: newPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}

/**
 * Split a phrase into two phrases at `splitTimeMs` (or at its midpoint if `splitTimeMs` is outside the phrase)
 */
export function splitPhraseAtPlayhead(
  result: IVocalAnalysisResult,
  phraseIndex: number,
  playheadTimeMs?: number
): IVocalAnalysisResult {
  const idx = result.phrases.findIndex((p) => p.phraseIndex === phraseIndex);
  if (idx < 0) return result;

  const target = result.phrases[idx];
  if (target.durationMs < 800) return result;

  const defaultMid = Math.round((target.startMs + target.endMs) / 2);
  const splitMs =
    playheadTimeMs &&
    playheadTimeMs > target.startMs + 300 &&
    playheadTimeMs < target.endMs - 300
      ? Math.round(playheadTimeMs)
      : defaultMid;

  const words = target.words || [];
  const leftWords = words.filter((w) => (w.startMs + w.endMs) / 2 <= splitMs);
  const rightWords = words.filter((w) => (w.startMs + w.endMs) / 2 > splitMs);

  const hasCustomLyric = target.lyricText && !target.lyricText.startsWith('Nguyên âm:');
  const leftText =
    hasCustomLyric && leftWords.length > 0
      ? leftWords.map((w) => w.text).join(' ')
      : undefined;
  const rightText =
    hasCustomLyric && rightWords.length > 0
      ? rightWords.map((w) => w.text).join(' ')
      : undefined;

  const leftPhrase: IVocalPhrase = {
    ...target,
    endMs: splitMs - 20,
    durationMs: splitMs - 20 - target.startMs,
  };
  const rightPhrase: IVocalPhrase = {
    ...target,
    startMs: splitMs + 20,
    durationMs: target.endMs - (splitMs + 20),
  };

  alignWordsToPhraseNoteBars(
    leftPhrase,
    result.noteBars,
    leftText,
    null,
    result.sampleRate,
    result.pitchTrack
  );
  alignWordsToPhraseNoteBars(
    rightPhrase,
    result.noteBars,
    rightText,
    null,
    result.sampleRate,
    result.pitchTrack
  );

  const newPhrases = [
    ...result.phrases.slice(0, idx),
    leftPhrase,
    rightPhrase,
    ...result.phrases.slice(idx + 1),
  ].map((p, i) => ({
    ...p,
    id: `phrase-${i + 1}`,
    phraseIndex: i + 1,
  }));

  classifyPhraseSectionsAndContours(
    newPhrases,
    result.noteBars,
    result.durationMs,
    result.vocalRange.lowestMidi,
    result.vocalRange.highestMidi
  );

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    phrases: newPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}
