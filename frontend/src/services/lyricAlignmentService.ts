/**
 * Deep Vowel Formant (F1/F2), Pitch Trajectory & Lyric Alignment Service (lyricAlignmentService.ts)
 *
 * Implements:
 * 1. Pre-emphasized Goertzel / Multi-Band Spectral Formant Analysis (F1: 280-900Hz, F2: 880-2580Hz)
 *    across Early & Late sub-windows of each sung note to detect pure vowels (/A/, /E-Ê/, /I/, /Ơ-Ư/, /O-Ô/, /U/)
 *    and diphthong transitions (/Ai/, /Ao/, /Ơi/, /Ia/, /Ua/, /Ôi/).
 * 2. Vietnamese Orthographic + Acoustic Hybrid Vowel Nucleus Extractor (`extractVietnameseWordVowel`)
 *    so known lyric words always display their exact Vietnamese vowel mouth shape alongside measured F1/F2 formants.
 * 3. Micro-Pitch Trajectory Analysis on every syllable/word:
 *    - Inter-syllable melodic step (`stepSemitones`: ↗ đi lên, ↘ đi xuống, → giữ ngang)
 *    - Intra-syllable vowel pitch bend (`pitchTrajectory`: ↗ vuốt lên, ↘ hạ xuống, ⤴ luyến vòm, ⤵ uốn võng, 〰 ngân rung, → giữ phẳng)
 * 4. Global LRC Time Offset Auto-Calibration + Breath-Snapped 1-to-1 Phrase Re-Segmentation
 *    so each lyric line matches its exact sung phrase without bleeding into adjacent phrases.
 * 5. Syllable-Onset NoteBar Subdivision + Phonology-Aware Dynamic Programming (DP) Word-to-Note Alignment
 *    so every word in a phrase matches its exact NoteBar(s).
 * 6. Contiguous Musical Block Section Landmarking (`Mở đầu`, `Phiên khúc 1`, `Tiền điệp khúc`, `Điệp khúc`, `Phiên khúc 2`, `Đoạn chuyển`, `Kết bài`).
 */

import { SOLFEGE_NAMES, NOTE_NAMES } from '@brain-exercises/shared';
import type {
  IVocalAnalysisResult,
  IVocalNoteBar,
  IVocalPhrase,
  IReferencePitchPoint,
} from './vocalFileAnalysisService';
import {
  type VietnameseToneType,
  TONE_PITCH_RANK,
  TONE_METADATA,
  getVietnameseToneType,
  getVietnameseToneInfo,
  computeToneMelodicTransitionCost,
  computePhraseToneMelodicHarmony,
} from './vietnameseToneProsodyService';
import {
  alignWindowSymmetricDP,
  clusterNoteBarsBySilence,
  expandClustersTowardCount,
  filterNoteBarsInTimeRange,
  findActiveWordIndexAtTime,
  findSparseAnchorChainOffsets,
  repairDamagedPhraseWindowsLocally,
  type IPhraseSlotDraft,
  type ISymmetricClusterInput,
  type ISymmetricLyricInput,
  type PhoneticClusterSlice,
  type PhoneticEvaluationFn,
} from './sequenceAlignmentEngine';
import { runAcousticWordForcedAlignment } from './acousticWordForcedAligner';
import {
  buildClusterPhoneticProfilesAsync,
  buildClusterProfileKey,
  computePhoneticLineToClusterDistance,
  estimateSliceVowelFormants,
  goertzelBandEnergy,
  mergeClusterPhoneticProfiles,
  profileAudioClusterPhonetics,
  type CoreVowelFamily,
  type IClusterPhoneticProfile,
} from './acousticPhoneticProfiler';

export {
  type VietnameseToneType,
  type CoreVowelFamily,
  TONE_PITCH_RANK,
  TONE_METADATA,
  getVietnameseToneType,
  getVietnameseToneInfo,
  computeToneMelodicTransitionCost,
  computePhraseToneMelodicHarmony,
  findActiveWordIndexAtTime,
};

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

export interface ISongLyricCandidate {
  id: string;
  trackName: string;
  artistName: string;
  durationSec?: number;
  durationDiffSec?: number;
  hasSyncedLyrics: boolean;
  confidencePct: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  syncedLyrics?: string;
  plainLyrics?: string;
  source: 'builtin' | 'lrclib' | 'local_cache' | 'manual';
  matchReasonVi: string;
}

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

export type DuetSingerId = 'voice_a' | 'voice_b' | 'both' | 'solo';

export type VietnamesePhoneticState =
  | 'SIL'
  | 'STOP_FRIC'
  | 'NASAL_LIQUID'
  | 'V_A'
  | 'V_E'
  | 'V_I'
  | 'V_O_UNROUND'
  | 'V_O_ROUND'
  | 'V_U';

export interface IVietnameseWordPhoneticDecomposition {
  onsetState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
  nucleusState: 'V_A' | 'V_E' | 'V_I' | 'V_O_UNROUND' | 'V_O_ROUND' | 'V_U';
  codaState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
}

export interface IVocalLyricWord {
  wordIndex: number;
  text: string;
  solfege: string;
  noteName: string;
  midi: number;
  startMs: number;
  endMs: number;
  /** Duration of this word's note(s) in milliseconds */
  durationMs?: number;
  /** True when this word is held significantly longer than normal (nốt ngân lâu hơn) */
  isSustained?: boolean;
  /** Human-readable sustain tag (e.g. "Ngân 1.2s") */
  sustainLabel?: string;
  /** Steady vowel sustain core duration in ms (excludes attack scoop and decaying reverb/accompaniment tail) */
  sustainCoreMs?: number;
  /** Classification of hold behavior for vocal coaching */
  sustainKind?: 'steady_hold' | 'vibrato_hold' | 'melisma_glide' | 'clipped';
  /** Ending note name when a single word glides/slurs across multiple notes (e.g. "E4" in C4→E4) */
  endNoteName?: string;
  /** Ending solfege when a single word glides/slurs across multiple notes */
  endSolfege?: string;
  /** Ending MIDI number when a word glides across multiple notes */
  endMidi?: number;
  /** Sequence of distinct consecutive note names sung within this word (e.g. ["C4", "E4"]) */
  noteSequence?: string[];
  /** Sequence of distinct consecutive solfege names sung within this word (e.g. ["Đô4", "Mi4"]) */
  solfegeSequence?: string[];
  /** Number of discrete note bars spanned by this word (1 = single note, >=2 = melisma/glide) */
  melismaNotesCount?: number;
  /** Net semitone glide from the start note to the end note WITHIN this word (+4 = từ thấp lên cao 4 bán âm) */
  glideSemitones?: number;
  /** Detected or orthographic vowel phoneme (e.g. "A", "Ê", "I", "Ô", "U", "Ư", "Ươ", "Uô", "Ơi", "Ai", "Ao") */
  vowelPhoneme?: string;
  vowelHint?: VowelMouthHint;
  /** Estimated formant frequencies [F1_Hz, F2_Hz] */
  formantsHz?: [number, number];
  /** Intra-word pitch contour shape */
  pitchTrajectory?: VowelPitchTrajectory;
  /** Compact arrow symbol: '↗' | '↘' | '⤴' | '⤵' | '〰' | '→' */
  trajectorySymbol?: string;
  /** Human-readable description of how this vowel moves in pitch */
  trajectoryLabel?: string;
  /** Semitone difference from the previous sung note/word (+3 = lên 3 bán âm, -2 = xuống 2 bán âm, 0 = ngang) */
  stepSemitones?: number;
  /** Pitch bend within the vowel itself from start to end in cents */
  intraBendCents?: number;
  /** 3-point relative pitch curve [startCents, midCents, endCents] for visual micro-contour */
  pitchCurveCents?: [number, number, number];
  /** Vietnamese lexical tone type: 'nang' | 'huyen' | 'ngang' | 'hoi' | 'nga' | 'sac' | 'neutral' */
  toneType?: VietnameseToneType;
  /** Relative pitch register rank (1.0 = Nặng đáy, 2.0 = Huyền, 3.0 = Ngang chuẩn, 3.8 = Hỏi, 4.4 = Ngã, 5.0 = Sắc đỉnh) */
  toneRank?: number;
  /** Human-readable Vietnamese tone name (e.g. "Thanh Nặng", "Thanh Bằng", "Thanh Sắc") */
  toneNameVi?: string;
  /** Concordance status with previous word ('concordant' | 'inverted' | 'neutral') */
  toneMelodicConcordance?: 'concordant' | 'inverted' | 'neutral';
}

export interface IAlignmentHealthReport {
  status: 'healthy' | 'partial_gaps' | 'mismatch_suspected' | 'no_lyrics';
  healthScorePct: number;
  coverageRatio: number;
  emptyAudioRatio: number;
  orphanVocalMs: number;
  missingGapRanges: Array<{ startMs: number; endMs: number; barCount: number }>;
  flaggedPhraseIndices: number[];
  summaryVi: string;
  matchedLrcCount?: number;
  recoveredDpCount?: number;
  autoGenCloneCount?: number;
  autoGenSynthCount?: number;
  engineSummaryVi?: string;
}

export interface ILrcLine {
  timeMs: number;
  text: string;
  /** Optional inline word-level timestamps parsed from Enhanced Karaoke LRC (`<mm:ss.xx>word`) */
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
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
    isAutoGeneratedMissing?: boolean;
    autoGenSource?: 'melodic_clone' | 'phonetic_synth' | 'ai_transcribe';
    isRecoveredByDp?: boolean;
    isMissingLyricGap?: boolean;
    alignmentIssueDetailVi?: string;
  }>;
}

const LYRIC_CACHE_PREFIX = 'brain_vocal_lyric_v13_';
const CLOUD_LRC_CACHE_PREFIX = 'brain_vocal_cloud_lrc_v9_';

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

export type VietnameseToneContour = 'rising' | 'falling' | 'dipping' | 'level';

/**
 * Extract the natural Vietnamese lexical tone pitch contour from a lyric word:
 * - Sắc (\u0301) / Ngã (\u0303) -> 'rising' (đi lên / cao)
 * - Huyền (\u0300) / Nặng (\u0323) -> 'falling' (đi xuống / trầm)
 * - Hỏi (\u0309) -> 'dipping' (uốn võng xuống rồi lên)
 * - Ngang (không dấu) -> 'level' (giữ ngang)
 */
export function extractVietnameseToneContour(rawWord: string): VietnameseToneContour {
  if (!rawWord) return 'level';
  const nfd = rawWord.toLowerCase().normalize('NFD');
  if (/[\u0301\u0303]/.test(nfd)) return 'rising';
  if (/[\u0300\u0323]/.test(nfd)) return 'falling';
  if (/\u0309/.test(nfd)) return 'dipping';
  return 'level';
}

/**
 * Extract the exact Vietnamese vowel nucleus, acoustic family, mouth-shape coaching hint,
 * and checked-stop coda status (`-p, -t, -c, -ch`) from a Vietnamese lyric word.
 */
export function extractVietnameseWordVowel(rawWord: string): {
  vowelPhoneme: string;
  vowelFamily: CoreVowelFamily;
  vowelHint: VowelMouthHint;
  isCheckedStop: boolean;
  toneContour?: VietnameseToneContour;
} | null {
  if (!rawWord) return null;
  // Strip tone marks (acute, grave, hook, tilde, dot below) while preserving vowel diacritics (ă, â, ê, ô, ơ, ư)
  const lower = rawWord
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC')
    .replace(/[^a-zà-ỹăâđêôơư]/gi, '');

  if (!lower) return null;

  // Check if word ends in a voiceless stop consonant (-p, -t, -c, -ch) -> short clipped syllable in Vietnamese
  const isCheckedStop = /(?:p|t|c|ch)$/i.test(lower);

  // Strip initial consonants (including qu-, gi-, ngh-, ng-, nh-, ch-, tr-, th-, ph-, kh-, gh-)
  const body = lower.replace(/^(?:ngh|ng|nh|ch|tr|th|ph|kh|gh|qu|gi|[bcdđghklmnpqrstvx])/i, '');
  const target = body || lower;

  // 1. Check Vietnamese Diphthongs & Triphthongs first
  if (/(?:ươi|ơi)/i.test(target)) {
    return {
      vowelPhoneme: 'Ơi',
      vowelFamily: 'Ơ',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:ươ|ưa)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('ưa') ? 'Ưa' : 'Ươ',
      vowelFamily: 'Ơ',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:iê|yê|ia|ya)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('ia') || target.includes('ya') ? 'Ia' : 'Iê',
      vowelFamily: 'I',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:uôi|ôi|oi)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('oi') && !target.includes('ôi') ? 'Oi' : 'Ôi',
      vowelFamily: 'Ô',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:uô|ua)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('ua') ? 'Ua' : 'Uô',
      vowelFamily: 'U',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:oai|oay|uây|ai|ay|ây)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('ây') ? 'Ây' : 'Ai',
      vowelFamily: 'A',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:ao|au|âu)/i.test(target)) {
    return {
      vowelPhoneme: target.includes('âu') ? 'Âu' : 'Ao',
      vowelFamily: 'A',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }
  if (/(?:êu|iu|ưu|ui|ưi)/i.test(target)) {
    const isU = target.includes('ui') || target.includes('ưi');
    return {
      vowelPhoneme: isU ? 'Ui' : 'Iu',
      vowelFamily: isU ? 'U' : 'I',
      vowelHint: 'Nguyên âm đôi (Chuyển khẩu hình)',
      isCheckedStop,
    };
  }

  // 2. Check Single Core Vowels (Monophthongs)
  if (target.includes('ư')) {
    return {
      vowelPhoneme: 'Ư',
      vowelFamily: 'Ơ',
      vowelHint: 'Ơ/Ư (Mở vừa tự nhiên)',
      isCheckedStop,
    };
  }
  if (target.includes('ơ')) {
    return {
      vowelPhoneme: 'Ơ',
      vowelFamily: 'Ơ',
      vowelHint: 'Ơ/Ư (Mở vừa tự nhiên)',
      isCheckedStop,
    };
  }
  if (target.includes('â')) {
    return {
      vowelPhoneme: 'Â',
      vowelFamily: 'Ơ',
      vowelHint: 'Ơ/Ư (Mở vừa tự nhiên)',
      isCheckedStop,
    };
  }
  if (target.includes('ă')) {
    return {
      vowelPhoneme: 'Ă',
      vowelFamily: 'A',
      vowelHint: 'A (Mở rộng hàm)',
      isCheckedStop,
    };
  }
  if (target.includes('a')) {
    return {
      vowelPhoneme: 'A',
      vowelFamily: 'A',
      vowelHint: 'A (Mở rộng hàm)',
      isCheckedStop,
    };
  }
  if (target.includes('ê')) {
    return {
      vowelPhoneme: 'Ê',
      vowelFamily: 'E',
      vowelHint: 'E/Ê (Mở ngang)',
      isCheckedStop,
    };
  }
  if (target.includes('e')) {
    return {
      vowelPhoneme: 'E',
      vowelFamily: 'E',
      vowelHint: 'E/Ê (Mở ngang)',
      isCheckedStop,
    };
  }
  if (target.includes('i') || target.includes('y')) {
    return {
      vowelPhoneme: 'I',
      vowelFamily: 'I',
      vowelHint: 'I (Khép dẹt sáng)',
      isCheckedStop,
    };
  }
  if (target.includes('ô')) {
    return {
      vowelPhoneme: 'Ô',
      vowelFamily: 'Ô',
      vowelHint: 'O/Ô (Tròn môi)',
      isCheckedStop,
    };
  }
  if (target.includes('o')) {
    return {
      vowelPhoneme: 'O',
      vowelFamily: 'Ô',
      vowelHint: 'O/Ô (Tròn môi)',
      isCheckedStop,
    };
  }
  if (target.includes('u')) {
    return {
      vowelPhoneme: 'U',
      vowelFamily: 'U',
      vowelHint: 'U (Chu môi sâu)',
      isCheckedStop,
    };
  }

  return null;
}

/**
 * Compute expected intrinsic phonetic duration weight of a Vietnamese syllable:
 * - Checked stops (`-p, -t, -c, -ch` like "bước", "thích", "mắt"): 0.55 (clipped closure)
 * - Short vowels (`ă, â` in closed syllables): 0.78
 * - Nasal/sonorant closed syllables (`-m, -n, -ng, -nh`): 1.00
 * - Open vowels & diphthongs (`-a, -ơ, -i, -u, -ai, -ao, -ơi, -ua, -iê, -ươ`): 1.22
 * - Clause-ending punctuation (`[,.;!?]$`) or phrase-final word (`isPhraseFinal`): ×1.45
 */
export function computeWordIntrinsicDurationWeight(
  rawWord: string,
  isPhraseFinal = false
): number {
  if (!rawWord) return 1.0;
  const hasClausePause = /[,.;!?…]$/.test(rawWord.trim());
  const lower = rawWord
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC')
    .replace(/[^a-zà-ỹăâđêôơư]/gi, '');

  let weight = 1.0;
  if (/(?:p|t|c|ch)$/i.test(lower)) {
    weight = 0.55;
  } else if (/[ăâ][mn]|(?:ă|â)ng|(?:ă|â)nh/i.test(lower)) {
    weight = 0.78;
  } else if (/(?:m|n|ng|nh)$/i.test(lower)) {
    weight = 1.0;
  } else {
    // Open syllable or diphthong ending (-a, -ơ, -i, -u, -ai, -ao, -ơi, -ua, -iê, -ươ)
    weight = 1.22;
  }

  if (isPhraseFinal || hasClausePause) {
    weight *= 1.45;
  }
  return Math.round(weight * 100) / 100;
}

/**
 * Decompose a Vietnamese word into its 3 sub-syllable acoustic-phonetic HMM/CTC states:
 * `[onsetState, nucleusState, codaState]` for Forced Alignment boundary scoring.
 */
export function decomposeVietnameseWordPhoneticStates(
  rawWord: string
): IVietnameseWordPhoneticDecomposition {
  const clean = (rawWord || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC')
    .replace(/[^a-zà-ỹăâđêôơư]/gi, '');

  let onsetState: IVietnameseWordPhoneticDecomposition['onsetState'] = 'NONE';
  if (/^(?:ngh|ng|nh|m|n|l|r|v|d|gi|y)/i.test(clean)) {
    onsetState = 'NASAL_LIQUID';
  } else if (/^(?:ch|gh|kh|ph|qu|th|tr|b|c|đ|g|h|k|p|s|t|x)/i.test(clean)) {
    onsetState = 'STOP_FRIC';
  }

  let codaState: IVietnameseWordPhoneticDecomposition['codaState'] = 'NONE';
  if (/(?:ch|p|t|c)$/i.test(clean)) {
    codaState = 'STOP_FRIC';
  } else if (/(?:ng|nh|m|n)$/i.test(clean)) {
    codaState = 'NASAL_LIQUID';
  }

  const vowelInfo = extractVietnameseWordVowel(rawWord);
  const family = vowelInfo?.vowelFamily || 'A';
  const nucleusMap: Record<
    CoreVowelFamily,
    IVietnameseWordPhoneticDecomposition['nucleusState']
  > = {
    A: 'V_A',
    E: 'V_E',
    I: 'V_I',
    Ơ: 'V_O_UNROUND',
    Ô: 'V_O_ROUND',
    U: 'V_U',
  };

  return {
    onsetState,
    nucleusState: nucleusMap[family] || 'V_A',
    codaState,
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
 * Built-in verified timestamped LRC registry for reference Vietnamese vocal/duet tracks.
 * Ensures 100% deterministic offline/online synced lyric alignment even when LRCLIB
 * returns HTTP 503 ServerOverloaded or prioritizes unsynced plainLyrics entries.
 */
const BUILTIN_VERIFIED_SYNCED_LRC: Array<{
  matchKeywords: string[];
  matchedTitle: string;
  syncedLyrics: string;
}> = [
  {
    matchKeywords: ['con mua tinh yeu'],
    matchedTitle: 'Cơn Mưa Tình Yêu – Hà Anh Tuấn & Phương Linh',
    syncedLyrics: `[00:34.14]Người yêu ơi cỏ mềm đã héo khô
[00:41.14]Mặt hồ lá xác xơ
[00:43.74]Những con đường vắng sương mờ
[00:49.61]Từng bước chân
[00:52.06]Cuốn đi mùa thu xa lắm
[00:57.36]Để nỗi buồn cứ thế đến bao giờ
[01:05.78]Và cơn mưa
[01:07.88]Ngoài trời đêm gió lạnh
[01:11.81]Giật mình nhớ tới anh
[01:14.96]Hãy chờ em anh nhé
[01:18.67]Và hãy cho nhau sát lại
[01:22.61]Nụ hôn như bất ngờ
[01:26.46]Ngọt ngào như vô tình
[01:30.27]Yêu anh ngàn lần hơn nữa
[01:35.00]Một phút anh ngẩn ngơ
[01:36.89]Một phút em thầm mơ
[01:38.80]Đừng vội làm cơn mưa
[01:40.61]Giăng kín trong lòng em
[01:42.93]Để trái tim ngủ quên
[01:44.79]Để nỗi đau triền miên
[01:46.60]Từng giọt buồn đánh rơi
[01:48.28]Trên hàng mi ướt mềm
[01:50.63]Thổn thức ta nhìn nhau
[01:52.37]Hẹn ước cho ngày sau
[01:54.37]Trọn đời mình bên nhau đi nhé anh tình yêu
[01:58.23]Vì chính em mà thôi
[02:00.13]Vì yêu anh mất rồi
[02:02.38]Sớm mai dành cho nhau tia nắng đầu tiên rạng ngời
[02:10.77]Người yêu ơi cỏ mềm đã héo khô
[02:16.94]Mặt hồ lá xác xơ
[02:20.28]Những con đường vắng sương mờ
[02:26.53]Từng bước chân
[02:28.80]Cuốn đi mùa thu xa lắm
[02:33.96]Để nỗi buồn cứ thế đến bao giờ
[02:42.16]Và cơn mưa
[02:44.37]Ngoài trời đêm gió lạnh
[02:48.23]Giật mình nhớ tới anh
[02:51.57]Hãy chờ em anh nhé
[02:55.35]Và hãy cho nhau sát lại
[02:59.38]Nụ hôn như bất ngờ
[03:03.73]Ngọt ngào như vô tình
[03:07.05]Yêu anh ngàn lần hơn nữa
[03:11.81]Một phút anh ngẩn ngơ
[03:13.66]Một phút em thầm mơ
[03:15.54]Đừng vội làm cơn mưa
[03:17.22]Giăng kín trong lòng em
[03:19.60]Để trái tim ngủ quên
[03:21.32]Để nỗi đau triền miên
[03:23.47]Từng giọt buồn đánh rơi
[03:25.10]Trên hàng mi ướt mềm
[03:27.29]Thổn thức ta nhìn nhau
[03:29.24]Hẹn ước cho ngày sau
[03:31.13]Trọn đời mình bên nhau đi nhé anh tình yêu
[03:34.95]Vì chính em mà thôi
[03:36.73]Vì yêu anh mất rồi
[03:39.06]Sớm mai dành cho nhau tia nắng đầu tiên rạng ngời
[03:47.93]Mưa xa dần hàng cây
[03:51.39]Hạt mưa mơn man giây phút này
[03:55.27]Ánh sao đưa ta về bên nhau
[04:01.99]Một phút anh ngẩn ngơ
[04:04.01]Một phút em thầm mơ
[04:05.89]Đừng vội làm cơn mưa
[04:07.44]Giăng kín trong lòng em
[04:09.78]Để trái tim ngủ quên
[04:11.87]Để nỗi đau triền miên
[04:13.84]Từng giọt buồn đánh rơi
[04:15.23]Trên hàng mi ướt mềm
[04:17.58]Thổn thức ta nhìn nhau
[04:19.52]Hẹn ước cho ngày sau
[04:21.28]Trọn đời mình bên nhau đi nhé anh tình yêu
[04:25.28]Vì chính em mà thôi
[04:27.30]Vì yêu anh mất rồi
[04:29.48]Sớm mai dành cho nhau tia nắng đầu tiên rạng ngời`,
  },
  {
    matchKeywords: ['anhs ems', 'anhs va ems'],
    matchedTitle: 'ANHS EMS (Chill n Free) – QNT, RZMas, Wxrdie',
    syncedLyrics: `[00:02.01](Yeah-y-yeah)
[00:06.09](Yeh yeh)
[00:09.47](No no no)
[00:13.14](Chill and free)
[00:15.89]Anh là người đàn ông may mắn, vì được đặt nụ hôn lên môi em
[00:19.69]Say trong hương thơm ngây ngất và mặc kệ thời gian kia trôi êm
[00:23.63]Bên trong anh như thêm sắc màu vì bàn tay em tô lên
[00:27.30]Long lanh bên trong đôi mắt nàng và hàng mi cong thôi miên
[00:31.16]Nhưng đôi khi anh không hiểu được chính mình (hiểu được chính mình)
[00:34.99]Youngboy nên không ai biết được tính tình (biết được tính tình)
[00:38.77]Anh hay về nhà yên giấc lúc bình minh
[00:42.39]Và anh lại còn hay yêu theo linh tính
[00:45.94]Khi anh biết em rời xa, anh đã quên một đóa hoa
[00:49.70]Khi anh biết em không còn, anh đã mất một món quà
[00:53.91]Falling in love, but looking for heart
[00:57.69]Trái tim này không thuộc về anh
[01:01.11]Khi anh nghĩ suy về em, đó dường như là thói quen
[01:05.12]Nhưng anh vẫn đi kiếm tìm, khi thành phố vừa lên đèn
[01:09.20]Tìm thấy những nỗi buồn, chỉ có những tấm hình
[01:12.63]Chỉ có anh cùng những điều đã mất
[01:16.45]Vì cuộc sống luôn thay màu
[01:18.60]Lùi một bước để thấy nhau
[01:20.22]Chỉ còn nhớ thương u sầu
[01:22.12]Chẳng còn nắm đôi tay nhau
[01:23.85]Con tim anh không biết tìm nơi đâu
[01:26.12]Đi giữa trời mưa ngâu
[01:28.06]Với nỗi nhớ này chưa lâu
[01:29.60]Nhưng luôn theo anh đến tận thâm sâu
[01:31.79]Người học cách yêu điên cuồng
[01:33.85]Rồi gục ngã trước thiên đường
[01:35.58]Chọn cuộc sống luôn kiên cường
[01:37.69]Để tìm kiếm những yêu thương
[01:39.05]Đôi chân em vẫn bước tìm muôn phương
[01:41.34]Đi giữa trời phong sương
[01:43.34]Bông hoa đã tàn không hương
[01:44.84]Sao em không soi rõ mình trong gương
[01:46.84]Anh là người đàn ông may mắn nhất trên cuộc đời
[01:50.88]Vì được trao yêu thương kia lên đôi môi
[01:54.64]Chẳng cần nói đâu em à, chỉ cần bên nhau em à
[01:58.21]Chỉ cần tay đan bàn tay nhau giữ chặt nhau như thế thôi
[02:01.87]Anh sẽ bước đi, vững bước tiếp đi không hề buông
[02:08.02]Phải sao cho em không rơi lệ buồn, ngồi ăn bên vệ đường
[02:12.92]Mà khi ta nhìn nhau trao nhau tình yêu không hề thay đổi
[02:16.84]Đừng làm nhau đau anh không muốn mất đi niềm tin
[02:20.56]Vì chỉ cần lạc nhau trong một tích tắc anh sẽ liền tìm
[02:24.87]Để mà kéo em lại gần, đặt nụ hôn không ngại ngần
[02:28.89]Vài lần thôi như vậy anh thay lời muốn nói
[02:32.18]Anh cần một tình yêu như là của bố anh và mẹ
[02:35.63]Một tình yêu giản đơn mỗi một lời nói là một lời thề
[02:40.22]Lời sẻ chia để thân hơn, ngồi đợi nhau về ăn cơm
[02:44.08]Từng ngày trôi qua là mỗi ngày hạnh phúc
[02:48.08]Vì cuộc sống luôn thay màu
[02:49.70]Lùi một bước để thấy nhau
[02:51.50]Chỉ còn nhớ thương u sầu
[02:53.66]Chẳng còn nắm đôi tay nhau
[02:55.23]Con tim anh không biết tìm nơi đâu
[02:57.56]Đi giữa trời mưa ngâu
[02:59.32]Với nỗi nhớ này chưa lâu
[03:00.85]Nhưng luôn theo anh đến tận thâm sâu
[03:03.15]Người học cách yêu điên cuồng
[03:05.08]Rồi gục ngã trước thiên đường
[03:06.97]Chọn cuộc sống luôn kiên cường
[03:08.96]Để tìm kiếm những yêu thương
[03:10.57]Đôi chân em vẫn bước tìm muôn phương
[03:12.86]Đi giữa trời phong sương
[03:14.52]Bông hoa đã tàn không hương
[03:16.21]Sao em không soi rõ mình trong gương
[03:18.35]Chẳng còn những đêm em và anh CircleK
[03:22.14]Cùng với những điếu Purple Haze
[03:26.08]Em bảo em bị ho em không hút được đâu
[03:29.85]Anh bảo yên tâm đi anh chơi mỗi đồ Tây
[03:33.19]Gorilla Glue trao cho em những nụ cười
[03:37.42]Blue Dream khi ta ra ngoài đi chơi
[03:41.08]Gelato chỉ dùng riêng khi mình lười
[03:44.73]Wedding Cake chắc chắn cho ngày cưới
[03:48.18]Hoặc làm phần tư, ta vi vu khắp thủ đô
[03:51.65]Yên sau luôn đủ chỗ, băng qua mọi khu phố
[03:55.63]Giờ thấy mình tự do trong muôn mỗi nhớ bự to
[03:59.47]Khi giờ đây phải tự lo vì em đã vút bay như gió (woh oh)
[04:04.37]Người học cách yêu điên cuồng
[04:05.95]Rồi gục ngã trước thiên đường
[04:08.06]Chọn cuộc sống luôn kiên cường
[04:09.86]Để tìm kiếm những yêu thương
[04:11.45]Đôi chân em vẫn bước tìm muôn phương
[04:13.86]Đi giữa trời phong sương
[04:15.62]Bông hoa đã tàn không hương
[04:17.19]Sao em không ôm lấy mình trong gương`,
  },
  {
    matchKeywords: ['can gi noi iu', 'can gi noi yeu'],
    matchedTitle: 'CẦN GÌ NÓI IU – Wxrdie & 2pillz',
    syncedLyrics: `[00:13.84]Hoodie lông gấu, baby girl em thật ngầu
[00:15.72]Trời hôm nay hơi rét nên má em đậm màu
[00:17.59]Hỏi "where do we go?", baby chỉ gật đầu
[00:19.35]Baby chỉ lặng im, bấm thang lên tầng lầu
[00:21.23]Nhân dịp Noel, nên em sẽ rên như thể hôm nay mới là lần đầu
[00:24.92]Thỏ thẻ vào tai anh rằng hôm nay em muốn
[00:26.74]Những trang giấy trắng của em phải thật nhàu
[00:28.49]Ừ thì em cũng ngon, trông em cũng cool
[00:30.25]Eo cũng thon, trông cũng đúng gu
[00:32.09]Môi này bao nhiêu son thì cũng dư
[00:33.85]Hình xăm con nai trên vai em trông cũng hư
[00:35.74]Nhìn dòng người hoà vào tiếng chuông
[00:39.60]Còn Giáng sinh này anh chỉ muốn
[00:42.99]Và đêm nay Noel
[00:43.75]Giá như được chill trên mông em
[00:45.04]Thì chắc phải là êm như bông kem
[00:46.52]Em bật Netflix nhưng anh không xem
[00:48.34]Baby bật công tắc, thì anh mới xông lên
[00:49.96]Đêm nay chắc chắn sẽ là một đêm không quên
[00:52.05]Nàng ngắm anh một lúc rồi bảo nhìn anh trông quen
[00:53.85]Còn vài cuộc hẹn khác nhưng em lại không đến
[00:55.30]Em yêu bảo làm thế để cho anh không ghen
[00:57.47]Đồ này khá trôi, em cũng khá say
[00:59.29]Em đòi khóa môi, em cho tôi khóa tay
[01:00.99]Em bảo muốn tôi, vì nhạc tôi quá hay
[01:02.83]Còn bạn trai em thì sao, em bảo "thích em đá ngay"
[01:04.68]Và vậy thì cần gì nói iu
[01:08.36]Bởi vì all I want for Christmas is you
[01:26.34]Chỉ muốn ngắm em, bắn em, cắn em
[01:29.22]Người khiến cho thằng em của anh quắn lên
[01:31.27]Để anh ra ngoài quấn ben
[01:32.59]Nay xác định trắng đêm
[01:33.37]Bởi vì mút môi em còn ngọt hơn cả mật
[01:35.74]Nên anh vẫn chưa thể nào tin đây là thật
[01:37.25]Nhắm mắt lại để anh có thể cảm nhận
[01:39.40]Anh biết em là một tác phẩm nghệ thuật
[01:41.29]Tattoo trên người em đang lộ dần
[01:42.75]Làm anh muốn hôn thật nhẹ lên từng bộ phận
[01:44.60]Anh cảm thấy ta như được chữa lành bội phần
[01:46.43]Anh cảm thấy ta như hiểu nhau hơn mọi lần
[01:48.28]Cưỡi lên trên người anh như tuần lộc
[01:50.11]Con quỷ dữ trong anh như được baby thuần phục
[01:51.67]Lắng nghe từng nhịp yêu trong lồng ngực
[01:53.56]Anh đang tới đây, baby girl không cần giục
[01:55.36]Chỉ cần thế thôi cũng đủ khiến anh phải mê òi
[01:57.73]Thế thôi cũng đủ khiến anh phải phê lòi
[01:59.36]Thế thôi chẳng còn chi để mà chê nổi
[02:01.14]Bạn bè vẫn khuyên nhưng mà anh không thèm nghe lời
[02:02.92]Ghé tai nghe giọng em có vị đường mật
[02:04.75]Giống y trong bài hát anh thường bật
[02:06.30]Biết ơn vũ trụ cho anh được gặp
[02:07.90]Chỉ muốn kế bên đến khi con tim ngừng đập
[02:10.11]Mời em chốt đi, cho lệnh yêu này được ban hành
[02:11.93]Chốt đi, khi mà anh vẫn còn đang rảnh
[02:13.73]Chốt đi, khi mùa đông này còn đang lạnh
[02:15.39]Chúc em một mùa Giáng Sinh thật an lành
[02:17.18]Lượn khắp nơi để hôm nay mới nhận ra
[02:18.97]Là mình đã lỡ yêu cô em ngay gần
[02:20.86]Tính anh tuy vô tư nhưng thật thà
[02:22.61]Trái tim anh trao em như phần quà`,
  },
  {
    matchKeywords: ['troi giau troi mang di', 'troi mang di', 'giua troi mang di', 'troi giau'],
    matchedTitle: 'Trời Giấu Trời Mang Đi – AMEE & ViruSs',
    syncedLyrics: `[00:18.12]Sương mờ che khuất đồi
[00:20.70]Đêm nào em cũng ngồi
[00:23.05]Lúc xa anh em thật sự chỉ nhớ mãi thôi
[00:28.61]Tuy rằng mới bắt đầu
[00:30.97]Tình yêu này như phép màu
[00:33.61]Cứ cho là vì mình chỉ mới nói hẹn hò thôi
[00:39.27]Nhưng vì anh quá tuyệt!
[00:41.38]Nhìn đâu thì em cũng duyệt
[00:44.19]Cứ như đôi mình nợ nhau từ lâu quá nhiều
[00:49.57]Đâu phải ai cũng hiểu, rằng khi mình nhớ quá nhiều
[00:54.40]Chẳng thể tập trung làm điều gì hết nữa
[00:58.73]Xa là sẽ nhớ ngay
[01:01.21]Xa là khóe mắt cay
[01:04.01]Xa là chỉ thấy em anh cười đôi mắt lim dim
[01:09.18]Xa là em sẽ tìm
[01:11.60]Sẽ nhìn anh cho dù ngày hay đêm
[01:15.26]Giá như ngay bây giờ được gặp nhau trước thềm
[01:19.55]Thôi thì chỉ ướt mi
[01:22.05]Do là nhớ quá đi
[01:24.85]Chẳng hiểu sao trước kia ông trời lại giấu anh đi
[01:29.98]Thôi thì chẳng có gì
[01:32.52]Do là em yêu nhiều, tại em đó
[01:36.22]Cứ coi như mây chẳng nhìn lời nói gió bay
[01:52.23]Dù ai nói
[01:54.38]Rằng đời này chúng ta thuộc về nhau tình yêu trăng sáng sao băng
[02:01.73]Con đường đầy lá rơi, nơi này mình từng đi
[02:07.10]Nhưng tiếc là
[02:09.93]Chẳng thấy anh đâu
[02:12.93]Dù ai nói
[02:15.28]Tình em đây mãi luôn ở bên anh chở che mưa nắng bão giông
[02:22.78]Gió lạnh đừng có lo, em ở ngay sau lưng
[02:28.46]Vẫn biết yêu thương làm con tim sẽ nhớ nhung
[02:32.59]Xa là sẽ nhớ ngay
[02:35.23]Xa là khóe mắt cay
[02:37.87]Xa là chỉ thấy em anh cười đôi mắt lim dim
[02:42.97]Xa là em sẽ tìm
[02:45.55]Sẽ nhìn anh cho dù ngày hay đêm
[02:49.03]Giá như ngay bây giờ được gặp nhau trước thềm
[02:53.35]Thôi thì chỉ ướt mi
[02:56.14]Do là nhớ quá đi
[02:58.50]Chẳng hiểu sao trước kia ông trời lại giấu anh đi
[03:03.86]Thôi thì chẳng có gì
[03:06.37]Do là em yêu nhiều, tại em đó
[03:09.91]Cứ coi như mây chẳng nhìn lời nói gió bay
[03:16.98]Con đường đầy nắng hoa
[03:19.25]Mà sao giờ anh đã xa
[03:22.21]Em ngồi đây khóc to do trời lại lấy anh đi
[03:27.43]Yêu là vì những gì
[03:29.91]Sao phải buông khi chẳng thể rời xa
[03:33.57]Gió mang cơn mưa về làm lòng ai não nề
[03:37.99]Thôi thì chỉ ướt mi
[03:40.49]Do là nhớ quá đi
[03:42.89]Chẳng hiểu sao trước kia ông trời lại giấu anh đi
[03:48.12]Thôi thì chẳng có gì
[03:50.73]Do là em yêu nhiều, tại em đó
[03:54.58]Cứ coi như mây chẳng nhìn lời nói gió bay`,
  },
];

function findBuiltinVerifiedSyncedLrc(
  fileName: string
): { syncedLyrics: string; matchedTitle: string } | null {
  const norm = normalizeVietnameseSearch(fileName.replace(/[._-]+/g, ' '));
  for (const entry of BUILTIN_VERIFIED_SYNCED_LRC) {
    if (entry.matchKeywords.some((kw) => norm.includes(kw))) {
      return {
        syncedLyrics: entry.syncedLyrics,
        matchedTitle: entry.matchedTitle,
      };
    }
  }
  return null;
}

/**
 * Build a lazily cached acoustic-phonetic evaluator for phrase alignment stages
 * without circular imports or repeated PCM DSP scans.
 */
function createPhoneticEvaluatorForTrack(
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = [],
  precomputedProfiles?: Map<string, IClusterPhoneticProfile>
): PhoneticEvaluationFn | undefined {
  if (!rawMonoPcm || sampleRate <= 0 || rawMonoPcm.length === 0) return undefined;
  const cache = precomputedProfiles ?? new Map<string, IClusterPhoneticProfile>();

  return (tokens: string[], clusterSlices: PhoneticClusterSlice[]) => {
    if (clusterSlices.length === 0) {
      return { phoneticBonusCost: 0, hasUsableAudio: false };
    }
    let combined: IClusterPhoneticProfile | undefined;
    for (const cs of clusterSlices) {
      const key = buildClusterProfileKey(cs.startMs, cs.endMs);
      let prof = cache.get(key);
      if (!prof) {
        prof = profileAudioClusterPhonetics({
          bars: cs.bars,
          startMs: cs.startMs,
          endMs: cs.endMs,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
        });
        cache.set(key, prof);
      }
      combined = mergeClusterPhoneticProfiles(combined, prof);
    }

    const res = computePhoneticLineToClusterDistance(tokens, combined, {
      decomposeWord: decomposeVietnameseWordPhoneticStates,
      extractVowel: (tk) =>
        extractVietnameseWordVowel(tk) ?? { vowelFamily: 'A', isCheckedStop: false },
    });
    return {
      phoneticBonusCost: res.phoneticBonusCost,
      acousticSyllableCount: res.acousticSyllableCount,
      hasUsableAudio: res.hasUsableAudio,
    };
  };
}

/**
 * Analyze both the Multi-Slice Vowel Formants (F1/F2 + Diphthong transition)
 * AND the Micro-Pitch Trajectory (cách nguyên âm đi lên/xuống/vòm/rung) for a single NoteBar.
 */
export function analyzeDeepNoteBarVowelAndTrajectory(params: {
  rawMonoPcm: Float32Array | null;
  sampleRate: number;
  bar: IVocalNoteBar;
  prevBar: IVocalNoteBar | null;
  pitchTrack: IReferencePitchPoint[];
}): {
  vowelPhoneme: string;
  vowelFamily: CoreVowelFamily;
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
    const fallbackVowels: Array<{
      v: string;
      fam: CoreVowelFamily;
      h: VowelMouthHint;
      f: [number, number];
    }> = [
      { v: 'A', fam: 'A', h: 'A (Mở rộng hàm)', f: [720, 1380] },
      { v: 'Ơi', fam: 'Ơ', h: 'Nguyên âm đôi (Chuyển khẩu hình)', f: [520, 1680] },
      { v: 'Ê', fam: 'E', h: 'E/Ê (Mở ngang)', f: [490, 1980] },
      { v: 'I', fam: 'I', h: 'I (Khép dẹt sáng)', f: [340, 2280] },
      { v: 'Ô', fam: 'Ô', h: 'O/Ô (Tròn môi)', f: [500, 960] },
      { v: 'U', fam: 'U', h: 'U (Chu môi sâu)', f: [340, 860] },
    ];
    const pick = fallbackVowels[((bar.midi % 12) + 12) % fallbackVowels.length];
    return {
      vowelPhoneme: pick.v,
      vowelFamily: pick.fam,
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

  const coreStart = rawStart + Math.floor(rawLen * 0.12);
  const coreEnd = Math.max(coreStart + 128, rawEnd - Math.floor(rawLen * 0.1));
  const coreMid = Math.floor((coreStart + coreEnd) / 2);

  const earlyFormant = estimateSliceVowelFormants(rawMonoPcm, coreStart, coreMid, sampleRate, f0Hz);
  const lateFormant = estimateSliceVowelFormants(rawMonoPcm, coreMid, coreEnd, sampleRate, f0Hz);

  const avgF1 = Math.round((earlyFormant.f1Hz + lateFormant.f1Hz) / 2);
  const avgF2 = Math.round((earlyFormant.f2Hz + lateFormant.f2Hz) / 2);

  const f2Shift = lateFormant.f2Hz - earlyFormant.f2Hz;
  let vowelPhoneme: string = earlyFormant.vowel === 'E' ? 'Ê' : earlyFormant.vowel;
  const vowelFamily: CoreVowelFamily = earlyFormant.vowel;
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
    vowelFamily,
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
 * Strictly select NoteBars whose temporal center belongs to `phrase`
 * so adjacent phrases never steal or share boundary notes.
 */
function getPhraseNoteBarsStrict(
  phrase: IVocalPhrase,
  allNoteBars: IVocalNoteBar[]
): IVocalNoteBar[] {
  return filterNoteBarsInTimeRange(phrase.startMs, phrase.endMs, allNoteBars, 15);
}

/**
 * Classify structural song sections (Intro, Verse 1, Pre-Chorus, Chorus, Climax, Verse 2, Bridge, Outro)
 * using Window-Smoothed Pitch/Energy Contours + Lyric Repetition Detection + Contiguous Block Enforcement
 * so sections form coherent musical blocks rather than flipping on individual phrases.
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

  // 1. Compute per-phrase melodic contour labels
  phrases.forEach((phrase) => {
    const phraseBars = getPhraseNoteBarsStrict(phrase, noteBars);
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
    phrase.contourLabel = contourLabel;
  });

  // 2. Short exercises / compact test cases (<= 5 phrases): direct landmarking
  if (phrases.length <= 5) {
    phrases.forEach((phrase, idx) => {
      const progressRatio =
        durationMs > 0 ? phrase.startMs / durationMs : idx / Math.max(1, phrases.length);
      const relativeHeight = (phrase.avgMidi - lowestMidi) / midiSpan;

      let sectionType: VocalSectionType = 'verse';
      let sectionLabel = 'Phiên khúc 1 (Tự sự)';

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
      }

      phrase.sectionType = sectionType;
      phrase.sectionLabel = sectionLabel;
      phrase.focusTip = buildSectionFocusTip(phrase, sectionType);
    });
    return;
  }

  // 3. Full Song Multi-Phrase Block Section Segmentation (phrases.length >= 6)
  const N = phrases.length;
  const rawHeights = phrases.map((p) => (p.avgMidi - lowestMidi) / midiSpan);

  // Detect repeated lyric lines across the song (strong chorus indicator)
  const normLyrics = phrases.map((p) =>
    p.lyricText && !p.lyricText.startsWith('Nguyên âm:')
      ? normalizeVietnameseSearch(p.lyricText)
      : ''
  );
  const isRepeatedLyric = phrases.map((_, i) => {
    const li = normLyrics[i];
    if (!li || li.length < 8) return false;
    return normLyrics.some(
      (lj, j) => Math.abs(i - j) >= 4 && lj.length >= 8 && (li === lj || li.includes(lj) || lj.includes(li))
    );
  });

  // 3-phrase moving window smoothed pitch/energy score
  const smoothedScore = phrases.map((_, i) => {
    let sum = 0;
    let wSum = 0;
    for (let k = Math.max(0, i - 1); k <= Math.min(N - 1, i + 1); k++) {
      const w = k === i ? 2.0 : 1.0;
      const repBonus = isRepeatedLyric[k] ? 0.12 : 0;
      const diffBonus = phrases[k].difficulty === 'Thử thách' ? 0.08 : 0;
      sum += (rawHeights[k] + repBonus + diffBonus) * w;
      wSum += w;
    }
    return sum / wSum;
  });

  // Compute adaptive chorus threshold from median and 68th percentile of smoothedScore
  const sortedScores = [...smoothedScore].sort((a, b) => a - b);
  const chorusThreshold = Math.max(
    0.54,
    sortedScores[Math.min(N - 1, Math.floor(N * 0.62))]
  );

  const rawTypes: VocalSectionType[] = new Array(N).fill('verse');
  const introCount = N >= 16 ? 2 : 1;
  const outroCount = N >= 16 ? 2 : 1;

  for (let i = 0; i < N; i++) {
    const progress = durationMs > 0 ? phrases[i].startMs / durationMs : i / N;
    if (i < introCount) {
      rawTypes[i] = 'intro';
    } else if (i >= N - outroCount) {
      rawTypes[i] = 'outro';
    } else if (smoothedScore[i] >= chorusThreshold) {
      rawTypes[i] = 'chorus';
    } else if (progress >= 0.68 && progress <= 0.88 && smoothedScore[i] < chorusThreshold) {
      rawTypes[i] = 'bridge';
    } else {
      rawTypes[i] = 'verse';
    }
  }

  // Contiguous Block Smoothing Pass: eliminate isolated 1-phrase section flickers
  for (let pass = 0; pass < 2; pass++) {
    for (let i = introCount; i < N - outroCount; i++) {
      const prev = rawTypes[i - 1];
      const curr = rawTypes[i];
      const next = rawTypes[i + 1];
      if (curr !== prev && curr !== next) {
        if (prev === next) {
          rawTypes[i] = prev;
        } else if (prev === 'verse' || prev === 'chorus') {
          rawTypes[i] = prev;
        }
      }
    }
  }

  // Mark 1-2 phrases right before each contiguous Chorus block as Pre-Chorus (Tiền điệp khúc)
  for (let i = introCount + 1; i < N - outroCount; i++) {
    if (rawTypes[i] === 'chorus' && rawTypes[i - 1] === 'verse') {
      rawTypes[i - 1] = 'pre_chorus';
      if (i - 2 >= introCount && rawTypes[i - 2] === 'verse' && N >= 14) {
        rawTypes[i - 2] = 'pre_chorus';
      }
    }
  }

  // Assign human-readable labels with Verse 1 / Verse 2 numbering
  let seenFirstChorus = false;
  phrases.forEach((phrase, i) => {
    let sectionType = rawTypes[i];
    if (sectionType === 'chorus') seenFirstChorus = true;

    // Highlight the single peak phrase inside Chorus as Climax if it's the highest in the song
    if (
      phrase.phraseIndex === climaxPhraseIdx &&
      sectionType === 'chorus' &&
      i > introCount &&
      i < N - outroCount
    ) {
      sectionType = 'climax';
    }

    let sectionLabel = 'Phiên khúc 1 (Tự sự)';
    switch (sectionType) {
      case 'intro':
        sectionLabel = 'Mở đầu (Vào bài)';
        break;
      case 'verse':
        sectionLabel = seenFirstChorus ? 'Phiên khúc 2 (Tự sự)' : 'Phiên khúc 1 (Tự sự)';
        break;
      case 'pre_chorus':
        sectionLabel = 'Tiền điệp khúc (Dẫn cao trào)';
        break;
      case 'chorus':
        sectionLabel = 'Điệp khúc (Cao trào)';
        break;
      case 'climax':
        sectionLabel = 'Đỉnh cao trào (Climax)';
        break;
      case 'bridge':
        sectionLabel = 'Đoạn chuyển (Bridge)';
        break;
      case 'outro':
        sectionLabel = 'Kết bài (Outro)';
        break;
    }

    phrase.sectionType = sectionType;
    phrase.sectionLabel = sectionLabel;
    phrase.focusTip = buildSectionFocusTip(phrase, sectionType);
  });
}

function buildSectionFocusTip(phrase: IVocalPhrase, sectionType: VocalSectionType): string {
  if (sectionType === 'climax' || sectionType === 'chorus') {
    return `Đoạn cao trào (${phrase.lowestNote} → ${phrase.highestNote}): Mở rộng khẩu hình ở các nguyên âm mở (/A/, /Ơ/) và nén hơi cơ hoành khi vuốt lên nốt ${phrase.highestNote}.`;
  }
  if (phrase.pitchJumpSemitones >= 5) {
    return `Có bước nhảy quãng ${phrase.pitchJumpSemitones} bán âm: Chú ý các mũi tên ↗ / ↘ trên từng nguyên âm để chuyển cao độ dứt khoát, không bị trượt giọng.`;
  }
  if (sectionType === 'outro') {
    return 'Đoạn kết: Giữ hơi thở sâu ở các nguyên âm cuối câu (↘) để hạ giọng êm mà không bị tụt phô.';
  }
  return 'Giữ cột hơi đều, phát âm rõ nguyên âm và bám sát hướng đi lên/xuống của từng từ.';
}

/**
 * Measure the Sub-Band Oral-to-Nasal Energy Ratio (in dB) at `timeMs`:
 * $$R_{\text{oral/nasal}}(t) = 10 \log_{10} \left( \frac{E_{600\text{–}2400\text{Hz}}(t)}{E_{200\text{–}360\text{Hz}}(t)} \right)$$
 * During voiced nasal/liquid consonants (`m, n, ng, nh, l` as in "đi mùa", "anh em"),
 * $f_0$ remains continuous ($>0.85$ clarity) while oral formant energy ($600\text{–}2400\text{Hz}$)
 * drops sharply relative to the low-frequency nasal murmur band ($200\text{–}360\text{Hz}$).
 */
export function computeOralToNasalRatioDbAtMs(
  rawMonoPcm: Float32Array | null | undefined,
  sampleRate: number,
  timeMs: number,
  avoidF0Hz?: number
): number {
  if (!rawMonoPcm || rawMonoPcm.length < 256 || sampleRate <= 0) return 0;
  const centerSample = Math.round((timeMs / 1000) * sampleRate);
  const winLen = Math.min(768, Math.max(256, Math.round(sampleRate * 0.018)));
  const startSample = Math.max(
    0,
    Math.min(rawMonoPcm.length - winLen, centerSample - Math.floor(winLen / 2))
  );
  if (startSample + winLen > rawMonoPcm.length) return 0;

  // Filter out any nasal bin if a female or high-pitch voice fundamental F0 matches that bin
  let nasalFreqs = [225, 285, 345];
  if (avoidF0Hz && avoidF0Hz > 160) {
    const filtered = nasalFreqs.filter((f) => Math.abs(f - avoidF0Hz) >= 28);
    if (filtered.length > 0) {
      nasalFreqs = filtered;
    }
  }
  const oralFreqs = [720, 1120, 1600, 2100];

  let nasalEnergy = 0;
  for (const f of nasalFreqs) {
    nasalEnergy += goertzelBandEnergy(rawMonoPcm, startSample, winLen, sampleRate, f);
  }
  nasalEnergy /= nasalFreqs.length;

  let oralEnergy = 0;
  for (const f of oralFreqs) {
    oralEnergy += goertzelBandEnergy(rawMonoPcm, startSample, winLen, sampleRate, f);
  }
  oralEnergy /= oralFreqs.length;

  const eps = 1e-12;
  return 10 * Math.log10((oralEnergy + eps) / (nasalEnergy + eps));
}

/**
 * Analyze a single NoteBar's internal acoustic contour to detect whether it contains:
 * 1. A genuine syllable re-articulation (consonant dip / bridged gap between two vowel peaks)
 * 2. A Sub-Band Nasal Murmur consonant boundary (`m, n, ng, nh, l` where $E_{600-2400}/E_{200-360}$ drops $\ge 3.5\text{dB}$)
 * 3. A merged 1-semitone stepwise pitch inflection (`isPitchStepInflection`, e.g. 63.15 D#4 -> 63.85 E4)
 * vs. a single smooth sustained hold (`nốt ngân lâu hơn`).
 */
function findInternalSyllableDip(
  targetBar: IVocalNoteBar,
  pitchTrack: IReferencePitchPoint[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100
): {
  splitMs: number;
  prominenceDb: number;
  isBridgedConsonant: boolean;
  isNasalConsonantDip: boolean;
  nasalDipDb: number;
  isPitchStepInflection: boolean;
  isSteadyVibrato: boolean;
  dipScore: number;
} {
  const barPts = pitchTrack.filter(
    (pt) =>
      pt.isVocal &&
      pt.midi > 0 &&
      pt.timeMs >= targetBar.startTimeMs &&
      pt.timeMs <= targetBar.endTimeMs
  );

  const fallbackMidMs = Math.round((targetBar.startTimeMs + targetBar.endTimeMs) / 2);
  if (barPts.length < 3) {
    return {
      splitMs: fallbackMidMs,
      prominenceDb: 0,
      isBridgedConsonant: false,
      isNasalConsonantDip: false,
      nasalDipDb: 0,
      isPitchStepInflection: false,
      isSteadyVibrato: false,
      dipScore: 0,
    };
  }

  const hasPcm = Boolean(rawMonoPcm && rawMonoPcm.length >= 256);
  const barF0Hz = targetBar.exactMidi > 0 ? 440 * Math.pow(2, (targetBar.exactMidi - 69) / 12) : 0;
  const oralNasalProfile = hasPcm
    ? barPts.map((pt) => {
        const ptF0Hz = pt.midi > 0 ? 440 * Math.pow(2, (pt.midi - 69) / 12) : barF0Hz;
        return computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, pt.timeMs, ptF0Hz);
      })
    : [];

  // Count vibrato oscillations across the bar to avoid chopping a single held vibrato note
  let vibratoOscillations = 0;
  let prevDelta = 0;
  for (let i = 1; i < barPts.length; i++) {
    const d = barPts[i].midi - barPts[i - 1].midi;
    if (Math.abs(d) > 0.06) {
      if (prevDelta * d < 0) vibratoOscillations++;
      prevDelta = d;
    }
  }
  const isSteadyVibrato = targetBar.durationMs >= 450 && vibratoOscillations >= 4;

  const minK = Math.max(1, Math.floor(barPts.length * 0.22));
  const maxK = Math.min(barPts.length - 2, Math.ceil(barPts.length * 0.78));

  let bestK = Math.floor(barPts.length / 2);
  let bestDipScore = -Infinity;
  let bestProminenceDb = 0;
  let bestBridged = false;
  let bestNasalDip = false;
  let bestNasalDipDb = 0;
  let bestPitchStep = false;

  for (let k = minK; k <= maxK; k++) {
    const candidateMs = barPts[k].timeMs;
    if (candidateMs - targetBar.startTimeMs < 75 || targetBar.endTimeMs - candidateMs < 75) {
      continue;
    }

    let leftPeakDb = -100;
    let leftPeakClarity = 0;
    let leftMidiSum = 0;
    let leftPeakOralNasal = -100;
    for (let l = 0; l <= k; l++) {
      if (l < k) {
        if (barPts[l].volumeDb > leftPeakDb) leftPeakDb = barPts[l].volumeDb;
        if (barPts[l].clarity > leftPeakClarity) leftPeakClarity = barPts[l].clarity;
        if (hasPcm && oralNasalProfile[l] > leftPeakOralNasal) {
          leftPeakOralNasal = oralNasalProfile[l];
        }
      }
      leftMidiSum += barPts[l].midi;
    }

    let rightPeakDb = -100;
    let rightPeakClarity = 0;
    let rightMidiSum = 0;
    let rightPeakOralNasal = -100;
    for (let r = k + 1; r < barPts.length; r++) {
      if (barPts[r].volumeDb > rightPeakDb) rightPeakDb = barPts[r].volumeDb;
      if (barPts[r].clarity > rightPeakClarity) rightPeakClarity = barPts[r].clarity;
      if (hasPcm && oralNasalProfile[r] > rightPeakOralNasal) {
        rightPeakOralNasal = oralNasalProfile[r];
      }
      rightMidiSum += barPts[r].midi;
    }

    const leftMeanMidi = leftMidiSum / (k + 1);
    const rightMeanMidi = rightMidiSum / Math.max(1, barPts.length - k - 1);
    const pitchStepDiff = Math.abs(rightMeanMidi - leftMeanMidi);
    const localPitchSlope = Math.abs(
      barPts[Math.min(barPts.length - 1, k + 1)].midi - barPts[k].midi
    );
    const isPitchStepInflection =
      !isSteadyVibrato &&
      pitchStepDiff >= 0.65 &&
      Math.round(rightMeanMidi) !== Math.round(leftMeanMidi);

    const valleyDb = barPts[k].volumeDb;
    const valleyClarity = barPts[k].clarity;
    // Prominence requires BOTH left and right sides to have higher energy than the valley (bimodal syllable envelope)
    const prominenceDb =
      leftPeakDb > -99 && rightPeakDb > -99
        ? Math.max(0, Math.min(leftPeakDb, rightPeakDb) - valleyDb)
        : 0;
    const isBridgedConsonant =
      valleyClarity <= 0.66 && leftPeakClarity >= 0.76 && rightPeakClarity >= 0.76;

    const nasalDipDb =
      hasPcm && leftPeakOralNasal > -99 && rightPeakOralNasal > -99
        ? Math.max(0, Math.min(leftPeakOralNasal, rightPeakOralNasal) - oralNasalProfile[k])
        : 0;
    const isNasalConsonantDip =
      nasalDipDb >= 3.5 && leftPeakClarity >= 0.72 && rightPeakClarity >= 0.72;

    const onsetBoost = Math.min(8.0, (barPts[k].onsetStrength || 0) * 1.15);

    const score =
      prominenceDb * 2.4 +
      onsetBoost +
      (isBridgedConsonant ? 14.0 : 0) +
      (isNasalConsonantDip ? 10.5 + nasalDipDb * 1.4 : 0) +
      (isPitchStepInflection ? pitchStepDiff * 8.5 + localPitchSlope * 6.0 : 0) +
      Math.max(0, 0.85 - valleyClarity) * 10 -
      (isSteadyVibrato && !isBridgedConsonant && !isNasalConsonantDip ? 8.0 : 0);

    if (score > bestDipScore) {
      bestDipScore = score;
      bestK = k;
      bestProminenceDb = prominenceDb;
      bestBridged = isBridgedConsonant;
      bestNasalDip = isNasalConsonantDip;
      bestNasalDipDb = nasalDipDb;
      bestPitchStep = isPitchStepInflection;
    }
  }

  const splitMs =
    bestDipScore > -Infinity ? barPts[bestK].timeMs : fallbackMidMs;

  return {
    splitMs,
    prominenceDb: bestProminenceDb,
    isBridgedConsonant: bestBridged,
    isNasalConsonantDip: bestNasalDip,
    nasalDipDb: bestNasalDipDb,
    isPitchStepInflection: bestPitchStep,
    isSteadyVibrato,
    dipScore: Math.max(0, bestDipScore),
  };
}

/**
 * Helper to split a single NoteBar at `splitMs` and update both `workingBars` and `allNoteBars`.
 */
function splitSingleBarAtMs(
  workingBars: IVocalNoteBar[],
  allNoteBars: IVocalNoteBar[],
  barIdx: number,
  splitMs: number,
  pitchTrack: IReferencePitchPoint[]
): void {
  const targetBar = workingBars[barIdx];
  const barPts = pitchTrack.filter(
    (pt) =>
      pt.isVocal &&
      pt.midi > 0 &&
      pt.timeMs >= targetBar.startTimeMs &&
      pt.timeMs <= targetBar.endTimeMs
  );

  const leftPts = barPts.filter((p) => p.timeMs <= splitMs);
  const rightPts = barPts.filter((p) => p.timeMs > splitMs);

  const calcExactMidi = (pts: IReferencePitchPoint[], fallback: number) =>
    pts.length > 0
      ? Math.round((pts.reduce((s, p) => s + p.midi, 0) / pts.length) * 100) / 100
      : fallback;

  const leftExact = calcExactMidi(leftPts, targetBar.exactMidi);
  const rightExact = calcExactMidi(rightPts, targetBar.exactMidi);
  const leftNom = Math.round(leftExact);
  const rightNom = Math.round(rightExact);
  const leftInfo = midiToCompactSolfege(leftNom);
  const rightInfo = midiToCompactSolfege(rightNom);

  const leftBar: IVocalNoteBar = {
    ...targetBar,
    id: `${targetBar.id}-a`,
    endTimeMs: splitMs - 5,
    durationMs: Math.max(60, splitMs - 5 - targetBar.startTimeMs),
    midi: leftNom,
    exactMidi: leftExact,
    noteName: leftInfo.noteName,
    solfegeName: leftInfo.solfege.replace(/(\d+)$/, ' $1'),
    avgCentsDiff: Math.round((leftExact - leftNom) * 100),
    pointsCount: Math.max(2, leftPts.length),
  };

  const rightBar: IVocalNoteBar = {
    ...targetBar,
    id: `${targetBar.id}-b`,
    startTimeMs: splitMs + 5,
    durationMs: Math.max(60, targetBar.endTimeMs - (splitMs + 5)),
    midi: rightNom,
    exactMidi: rightExact,
    noteName: rightInfo.noteName,
    solfegeName: rightInfo.solfege.replace(/(\d+)$/, ' $1'),
    avgCentsDiff: Math.round((rightExact - rightNom) * 100),
    pointsCount: Math.max(2, rightPts.length),
  };

  workingBars.splice(barIdx, 1, leftBar, rightBar);
  const globalIdx = allNoteBars.findIndex((b) => b.id === targetBar.id);
  if (globalIdx >= 0) {
    allNoteBars.splice(globalIdx, 1, leftBar, rightBar);
  }
}

/**
 * Absorb transient vocal attack scoops (<= 85ms, gap <= 20ms) and release tails (<= 75ms)
 * into their parent sustained note bar so a 60ms attack scoop never steals an entire word slot!
 */
function fuseMicroScoopAndTailBars(
  phraseBars: IVocalNoteBar[],
  allNoteBars: IVocalNoteBar[],
  targetWordCount: number
): IVocalNoteBar[] {
  const working = [...phraseBars];
  if (working.length <= 1 || working.length <= targetWordCount) return working;

  // 1. Absorb leading micro-attack scoops (e.g. 60ms scoop from C#4 into 380ms D#4)
  for (let i = 0; i < working.length - 1 && working.length > targetWordCount; i++) {
    const curr = working[i];
    const next = working[i + 1];
    const gap = next.startTimeMs - curr.endTimeMs;
    const semitoneDiff = Math.abs(next.midi - curr.midi);
    if (
      curr.durationMs <= 85 &&
      next.durationMs >= 180 &&
      gap <= 22 &&
      semitoneDiff >= 1 &&
      semitoneDiff <= 4
    ) {
      next.startTimeMs = curr.startTimeMs;
      next.durationMs = next.endTimeMs - next.startTimeMs;
      next.pointsCount += curr.pointsCount;
      working.splice(i, 1);
      const gIdx = allNoteBars.findIndex((b) => b.id === curr.id);
      if (gIdx >= 0) allNoteBars.splice(gIdx, 1);
      i--;
    }
  }

  // 2. Absorb trailing micro-release fall-offs (e.g. 65ms release drop at end of a long sustained note)
  for (let i = 1; i < working.length && working.length > targetWordCount; i++) {
    const prev = working[i - 1];
    const curr = working[i];
    const gap = curr.startTimeMs - prev.endTimeMs;
    const semitoneDiff = Math.abs(curr.midi - prev.midi);
    if (
      curr.durationMs <= 75 &&
      prev.durationMs >= 220 &&
      gap <= 18 &&
      semitoneDiff >= 1 &&
      semitoneDiff <= 4
    ) {
      prev.endTimeMs = curr.endTimeMs;
      prev.durationMs = prev.endTimeMs - prev.startTimeMs;
      prev.pointsCount += curr.pointsCount;
      working.splice(i, 1);
      const gIdx = allNoteBars.findIndex((b) => b.id === curr.id);
      if (gIdx >= 0) allNoteBars.splice(gIdx, 1);
      i--;
    }
  }

  return working;
}

/**
 * Intelligent Syllable-Pulse & Sustain Subdivision:
 * 1. Even when $B \ge W$, if the phrase contains legato pitch glides (`nốt từ thấp lên cao`) AND
 *    a long bar contains a high-confidence internal consonant boundary (2 words sung on the same pitch),
 *    splits the multi-syllable bar so DP can simultaneously resolve the same-pitch words AND the multi-note glide!
 * 2. When $B < W$, prioritizes splitting bars that exhibit a true bimodal syllable consonant valley (`dipScore`)
 *    rather than blindly chopping a single long sustained note (`nốt ngân lâu hơn`).
 */
function subdivideSustainedBarsForWords(
  phraseBars: IVocalNoteBar[],
  allNoteBars: IVocalNoteBar[],
  targetWordCount: number,
  pitchTrack: IReferencePitchPoint[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  wordTimestamps?: Array<{ timeMs: number; text: string }>
): IVocalNoteBar[] {
  const workingBars = fuseMicroScoopAndTailBars(phraseBars, allNoteBars, targetWordCount);
  if (workingBars.length === 0 || targetWordCount <= 1) return workingBars;

  // Phase 0: If Enhanced LRC wordTimestamps are available and B < W, split bars that explicitly contain >=2 word timestamps
  if (wordTimestamps && wordTimestamps.length >= 2 && workingBars.length < targetWordCount) {
    let didSplit = true;
    while (didSplit && workingBars.length < targetWordCount) {
      didSplit = false;
      for (let i = 0; i < workingBars.length && workingBars.length < targetWordCount; i++) {
        const bar = workingBars[i];
        if (bar.durationMs < 160) continue;
        const hits = wordTimestamps
          .filter((wt) => wt.timeMs >= bar.startTimeMs - 60 && wt.timeMs <= bar.endTimeMs - 40)
          .sort((a, b) => a.timeMs - b.timeMs);
        if (hits.length >= 2) {
          // Split between the 1st and remaining word timestamps inside this bar
          const targetMid = Math.round((hits[0].timeMs + hits[1].timeMs) / 2);
          const clampedSplit = Math.max(
            bar.startTimeMs + 60,
            Math.min(bar.endTimeMs - 60, hits[1].timeMs > bar.startTimeMs + 60 ? hits[1].timeMs - 15 : targetMid)
          );
          splitSingleBarAtMs(workingBars, allNoteBars, i, clampedSplit, pitchTrack);
          didSplit = true;
          break;
        }
      }
    }
  }

  // Phase A: Check if there are legato pitch glides (gap <= 25ms, pitch change 1..7 semitones)
  // that should be grouped onto a single word while another bar has a strong internal consonant dip
  let legatoGlideCount = 0;
  for (let i = 0; i < workingBars.length - 1; i++) {
    const gap = workingBars[i + 1].startTimeMs - workingBars[i].endTimeMs;
    const step = Math.abs(workingBars[i + 1].midi - workingBars[i].midi);
    if (gap <= 25 && step >= 1 && step <= 7) {
      legatoGlideCount++;
    }
  }

  const maxAllowedBarsForHighConfSplit = targetWordCount + Math.min(2, legatoGlideCount);
  while (workingBars.length < maxAllowedBarsForHighConfSplit) {
    let bestIdx = -1;
    let bestDip: ReturnType<typeof findInternalSyllableDip> | null = null;

    for (let i = 0; i < workingBars.length; i++) {
      if (workingBars[i].durationMs < 320) continue;
      const dip = findInternalSyllableDip(workingBars[i], pitchTrack, rawMonoPcm, sampleRate);
      if (
        (dip.isBridgedConsonant ||
          dip.isNasalConsonantDip ||
          dip.prominenceDb >= 4.5 ||
          dip.isPitchStepInflection) &&
        (!bestDip || dip.dipScore > bestDip.dipScore)
      ) {
        bestDip = dip;
        bestIdx = i;
      }
    }

    if (bestIdx < 0 || !bestDip) break;
    splitSingleBarAtMs(workingBars, allNoteBars, bestIdx, bestDip.splitMs, pitchTrack);
  }

  // Phase B: If we still have fewer bars than words ($B < W$), split bars prioritizing genuine syllable valleys
  // over pure duration so single sustained notes (`nốt ngân lâu hơn`) are preserved whenever possible!
  while (workingBars.length > 0 && workingBars.length < targetWordCount) {
    let bestIdx = -1;
    let bestCompositeScore = -Infinity;
    let bestSplitMs = 0;

    for (let i = 0; i < workingBars.length; i++) {
      const bar = workingBars[i];
      if (bar.durationMs < 180) continue;
      const dip = findInternalSyllableDip(bar, pitchTrack, rawMonoPcm, sampleRate);
      // Combine acoustic syllable valley score with duration weight
      const durationFactor = Math.min(9.0, bar.durationMs / 160);
      const compositeScore = dip.dipScore * 1.8 + durationFactor;
      if (compositeScore > bestCompositeScore) {
        bestCompositeScore = compositeScore;
        bestIdx = i;
        bestSplitMs = dip.splitMs;
      }
    }

    if (bestIdx < 0) break;
    splitSingleBarAtMs(workingBars, allNoteBars, bestIdx, bestSplitMs, pitchTrack);
  }

  return workingBars;
}

/**
 * Phonology, Sustain & Legato-Glide Dynamic Programming (DP) Partitioner:
 * Maps $B$ NoteBars ($B \ge W$) onto $W$ Vietnamese words so that:
 * - Multi-note glides from low to high (`từ thấp lên cao`) or high to low (`từ cao xuống thấp`)
 *   with continuous vowel energy (`isLegatoSlur`) naturally bind to the gliding word.
 * - Long sustained notes (`nốt ngân lâu hơn`) bind to open/sonorant words rather than checked stops.
 * - Checked-stop words (`-p, -t, -c, -ch` like "bước", "biết") stay on single notes.
 * - Words never group bars across a breath/consonant silence gap (> 65ms) or across split same-pitch bars.
 */
function partitionBarsToWordsDP(
  phraseBars: IVocalNoteBar[],
  barAnalysisList: Array<{
    vowelFamily: CoreVowelFamily;
    stepSemitones: number;
    intraBendCents: number;
  }>,
  rawTokens: string[],
  pitchTrack: IReferencePitchPoint[] = [],
  wordTimestamps?: Array<{ timeMs: number; text: string }>,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100
): Array<{ startBarIdx: number; endBarIdx: number }> {
  const W = rawTokens.length;
  const B = phraseBars.length;

  if (W === 0 || B === 0) return [];
  if (W === B) {
    return rawTokens.map((_, i) => ({ startBarIdx: i, endBarIdx: i }));
  }
  if (W === 1) {
    return [{ startBarIdx: 0, endBarIdx: B - 1 }];
  }

  const wordPhonology = rawTokens.map((tk) => extractVietnameseWordVowel(tk));
  const wordPhoneticStates = rawTokens.map((tk) => decomposeVietnameseWordPhoneticStates(tk));
  const wordTones = rawTokens.map((tk) => extractVietnameseToneContour(tk));
  const wordIntrinsicWeights = rawTokens.map((tk, idx) =>
    computeWordIntrinsicDurationWeight(tk, idx === W - 1)
  );
  const totalIntrinsicWeight = wordIntrinsicWeights.reduce((s, w) => s + w, 0) || 1;
  const totalPhraseBarDur = phraseBars.reduce((s, b) => s + b.durationMs, 0) || 1000;

  // Compute median bar duration in this phrase to identify long sustained notes (`nốt ngân lâu hơn`)
  const sortedDurs = phraseBars.map((b) => b.durationMs).sort((a, b) => a - b);
  const medianBarDur = sortedDurs[Math.floor(sortedDurs.length / 2)] || 300;
  const hasPcm = Boolean(rawMonoPcm && rawMonoPcm.length >= 256);

  // Precompute acoustic boundary transitions between adjacent bars (j -> j + 1)
  const transitions = phraseBars.slice(0, B - 1).map((barJ, j) => {
    const barNext = phraseBars[j + 1];
    const gapMs = barNext.startTimeMs - barJ.endTimeMs;
    const pitchStep = barNext.midi - barJ.midi;
    const samePitch = barNext.midi === barJ.midi;
    const sameVowelFamily =
      barAnalysisList[j]?.vowelFamily === barAnalysisList[j + 1]?.vowelFamily;

    // Inspect pitchTrack around the junction for consonant energy drop or bridged unvoiced frames
    let hasConsonantBoundary = gapMs >= 26 || samePitch;
    if (!hasConsonantBoundary && pitchTrack.length > 0) {
      const junctionPts = pitchTrack.filter(
        (p) => p.timeMs >= barJ.endTimeMs - 35 && p.timeMs <= barNext.startTimeMs + 35
      );
      if (junctionPts.some((p) => !p.isVocal || p.clarity <= 0.66)) {
        hasConsonantBoundary = true;
      }
    }

    let hasNasalTransition = false;
    if (hasPcm && gapMs <= 45) {
      const junctionMs = Math.round((barJ.endTimeMs + barNext.startTimeMs) / 2);
      const leftMidMs = Math.round((barJ.startTimeMs + barJ.endTimeMs) / 2);
      const rightMidMs = Math.round((barNext.startTimeMs + barNext.endTimeMs) / 2);
      const jRatio = computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, junctionMs);
      const lRatio = computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, leftMidMs);
      const rRatio = computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, rightMidMs);
      if (Math.min(lRatio, rRatio) - jRatio >= 2.8) {
        hasNasalTransition = true;
      }
    }

    const isLegatoSlur =
      gapMs <= 25 &&
      !hasConsonantBoundary &&
      !hasNasalTransition &&
      !samePitch &&
      Math.abs(pitchStep) >= 1 &&
      Math.abs(pitchStep) <= 8;

    return {
      gapMs,
      pitchStep,
      samePitch,
      sameVowelFamily,
      hasConsonantBoundary,
      hasNasalTransition,
      isLegatoSlur,
    };
  });

  // dp[w][b] = min cost to assign words 0..w using bars 0..b
  const dp: number[][] = Array.from({ length: W }, () => new Array(B).fill(Infinity));
  const prevSplit: number[][] = Array.from({ length: W }, () => new Array(B).fill(0));

  const spanCost = (wIdx: number, startBar: number, endBar: number): number => {
    const span = endBar - startBar + 1;
    const phon = wordPhonology[wIdx];
    const pState = wordPhoneticStates[wIdx];
    const tone = wordTones[wIdx];
    const ac = barAnalysisList[startBar];
    let cost = 0;

    // 1. Inter-word onset & coda phonetic state alignment (between startBar - 1 and startBar)
    if (startBar > 0) {
      const prevTr = transitions[startBar - 1];
      if (prevTr.gapMs >= 22 || prevTr.hasConsonantBoundary) {
        cost -= Math.min(18, Math.max(0, prevTr.gapMs) * 0.14 + (prevTr.hasConsonantBoundary ? 5.5 : 0));
      } else if (prevTr.isLegatoSlur && prevTr.sameVowelFamily) {
        // Breaking a continuous same-vowel legato slur across two different words has a mild penalty
        cost += 3.2;
      }

      if (pState.onsetState === 'STOP_FRIC' && (prevTr.gapMs >= 18 || prevTr.hasConsonantBoundary)) {
        cost -= 2.2;
      } else if (pState.onsetState === 'NASAL_LIQUID' && (prevTr.hasNasalTransition || prevTr.gapMs <= 30)) {
        cost -= prevTr.hasNasalTransition ? 2.6 : 1.0;
      }
    }

    if (endBar < B - 1) {
      const nextTr = transitions[endBar];
      if (pState.codaState === 'STOP_FRIC' && (nextTr.gapMs >= 18 || nextTr.hasConsonantBoundary)) {
        cost -= 2.0;
      } else if (pState.codaState === 'NASAL_LIQUID' && nextTr.hasNasalTransition) {
        cost -= 2.0;
      }
    }

    // 2. Intra-word transitions (when a single word spans multiple notes: `startBar .. endBar`)
    let totalSpanDur = 0;
    for (let j = startBar; j <= endBar; j++) {
      totalSpanDur += phraseBars[j].durationMs;
    }

    for (let j = startBar; j < endBar; j++) {
      const tr = transitions[j];
      if (tr.samePitch) {
        // Two separate bars of the exact same pitch are separate syllables, never a melisma!
        cost += 22.0;
      }
      if (tr.gapMs > 65) {
        cost += (tr.gapMs - 45) * 0.48;
      }
      if (tr.hasConsonantBoundary && !tr.samePitch) {
        cost += 9.5;
      }
      if (tr.isLegatoSlur) {
        // True vocal slur (e.g. low-to-high or high-to-low on one word)
        cost -= 3.6;
        if (tr.sameVowelFamily) {
          cost -= 2.2;
        }
      }
    }

    // 3. Melisma (span > 1) phonological & tonal constraints
    if (span > 1) {
      // Base regularization so 1-note-per-word is preferred unless legato slur is present
      cost += (span - 1) * 4.8;

      // Checked-stop syllables (-p, -t, -c, -ch like "bước", "thích", "biết") rarely melisma
      if (phon?.isCheckedStop) {
        cost += (span - 1) * 20.0;
      }

      // Phrase-final word or clause-ending word naturally sustains/melismas
      if (wIdx === W - 1 || /[,.;!?]$/.test(rawTokens[wIdx])) {
        cost -= 4.8;
      }

      // Vietnamese Tone Agreement with Multi-Note Glide (từ thấp lên cao vs từ cao xuống thấp)
      const netGlide = phraseBars[endBar].midi - phraseBars[startBar].midi;
      if (netGlide >= 1 && (tone === 'rising' || tone === 'dipping' || tone === 'level')) {
        cost -= 2.6;
      } else if (netGlide <= -1 && (tone === 'falling' || tone === 'level')) {
        cost -= 2.6;
      }
    }

    // 4. Sustained Note Matching (`nốt ngân lâu hơn`) & Intrinsic Phonetic Duration Proportionality
    const isLongSustain = totalSpanDur >= Math.max(580, medianBarDur * 1.45);
    if (isLongSustain) {
      if (phon?.isCheckedStop) {
        // Checked-stop syllables are clipped; penalize assigning them to the longest held notes
        cost += 5.5;
      } else {
        // Open/sonorant syllables naturally hold sustained notes
        cost -= 2.2;
      }
      if (wIdx === W - 1 || /[,.;!?]$/.test(rawTokens[wIdx])) {
        cost -= 2.5;
      }
    }

    const expectedDurMs = (wordIntrinsicWeights[wIdx] / totalIntrinsicWeight) * totalPhraseBarDur;
    const relDurDiff = Math.abs(totalSpanDur - expectedDurMs) / Math.max(240, expectedDurMs);
    cost += Math.min(4.5, relDurDiff * 1.65);

    // 5. Optional Enhanced LRC Word Timestamp (`<mm:ss.xx>word`) Anchor Bonus
    const wordTs = wordTimestamps?.[wIdx];
    if (wordTs && Number.isFinite(wordTs.timeMs)) {
      const startDiffMs = Math.abs(phraseBars[startBar].startTimeMs - wordTs.timeMs);
      if (startDiffMs <= 450) {
        cost -= (450 - startDiffMs) * 0.028;
      } else {
        cost += Math.min(14, (startDiffMs - 450) * 0.015);
      }
    }

    // 6. Vowel Formant & Lexical Tone Step compatibility bonus
    if (phon && ac && phon.vowelFamily === ac.vowelFamily) {
      cost -= 2.5;
    }
    if (ac) {
      if ((ac.stepSemitones >= 1 || ac.intraBendCents >= 25) && tone === 'rising') {
        cost -= 1.6;
      } else if ((ac.stepSemitones <= -1 || ac.intraBendCents <= -25) && tone === 'falling') {
        cost -= 1.6;
      }
    }

    return cost;
  };

  // Base case w = 0 (allow skipping an isolated stray leading micro-breath bar when B > W so it never cascades all words!)
  const firstBar = phraseBars[0];
  const canSkipLeadingNoiseBar =
    B > W &&
    firstBar.durationMs <= 85 &&
    firstBar.pointsCount <= 3 &&
    transitions[0]?.gapMs >= 100;
  const maxFirstEnd = B - W;
  for (let b = 0; b <= maxFirstEnd; b++) {
    dp[0][b] = spanCost(0, 0, b);
    prevSplit[0][b] = 0;
  }
  if (canSkipLeadingNoiseBar && maxFirstEnd >= 1) {
    for (let b = 1; b <= maxFirstEnd; b++) {
      const skipLeadCand = 2.0 + spanCost(0, 1, b);
      if (skipLeadCand < dp[0][b]) {
        dp[0][b] = skipLeadCand;
        prevSplit[0][b] = 1;
      }
    }
  }

  // Transitions for w = 1 .. W - 1
  for (let w = 1; w < W; w++) {
    const minEnd = w;
    const maxEnd = B - 1 - (W - 1 - w);
    for (let b = minEnd; b <= maxEnd; b++) {
      for (let prevB = w - 1; prevB < b; prevB++) {
        if (dp[w - 1][prevB] === Infinity) continue;
        const prevBar = phraseBars[prevB];
        const nextBar = phraseBars[prevB + 1];
        const toneTr = computeToneMelodicTransitionCost(
          rawTokens[w - 1],
          rawTokens[w],
          prevBar.midi,
          nextBar.midi
        );
        const candidate =
          dp[w - 1][prevB] + spanCost(w, prevB + 1, b) + toneTr.penaltyOrBonusCost;
        if (candidate < dp[w][b]) {
          dp[w][b] = candidate;
          prevSplit[w][b] = prevB + 1;
        }
      }
    }
  }

  // Backtrack from (W - 1, B - 1), or (W - 1, B - 2) if final bar is an isolated micro-click/release artifact
  const lastBar = phraseBars[B - 1];
  const canSkipTrailingNoiseBar =
    B > W &&
    B >= 3 &&
    lastBar.durationMs <= 85 &&
    lastBar.pointsCount <= 3 &&
    transitions[B - 2]?.gapMs >= 100;

  let currEnd = B - 1;
  if (
    canSkipTrailingNoiseBar &&
    dp[W - 1][B - 2] + 2.0 < dp[W - 1][B - 1]
  ) {
    currEnd = B - 2;
  }

  const ranges: Array<{ startBarIdx: number; endBarIdx: number }> = new Array(W);
  for (let w = W - 1; w >= 0; w--) {
    const start = prevSplit[w][currEnd];
    ranges[w] = { startBarIdx: start, endBarIdx: currEnd };
    currEnd = start - 1;
  }

  return ranges;
}

/**
 * Compute accurate local MIDI pitch, steady sustain core duration, and hold classification
 * for an individual word window [wStart, wEnd] directly from pitchTrack.
 */
function computeWordAcousticStats(
  wStart: number,
  wEnd: number,
  pitchTrack: IReferencePitchPoint[],
  fallbackMidi: number,
  isCheckedStop: boolean,
  melismaNotesCount: number
): {
  midi: number;
  exactMidi: number;
  noteName: string;
  solfege: string;
  sustainCoreMs: number;
  sustainKind?: 'steady_hold' | 'vibrato_hold' | 'melisma_glide' | 'clipped';
} {
  const pts = pitchTrack.filter(
    (pt) => pt.isVocal && pt.midi > 0 && pt.clarity >= 0.4 && pt.timeMs >= wStart && pt.timeMs <= wEnd
  );

  let exactMidi = fallbackMidi;
  let sustainCoreMs = 0;
  let vibratoOscillations = 0;

  if (pts.length > 0) {
    // Trim 12% attack & 10% release if enough samples exist
    const slice =
      pts.length >= 6
        ? pts.slice(Math.floor(pts.length * 0.12), Math.ceil(pts.length * 0.9))
        : pts;

    // Weighted median / average for robust word center pitch
    const sorted = [...slice].sort((a, b) => a.midi - b.midi);
    const medianMidi = sorted[Math.floor(sorted.length / 2)].midi;
    let wSum = 0;
    let mSum = 0;
    let peakDb = -100;
    for (const p of pts) {
      if (p.volumeDb > peakDb) peakDb = p.volumeDb;
    }
    for (const p of slice) {
      const weight = Math.max(0.1, p.clarity) * Math.pow(10, Math.max(-50, p.volumeDb) / 40);
      wSum += weight;
      mSum += p.midi * weight;
    }
    const wAvg = wSum > 0 ? mSum / wSum : medianMidi;
    exactMidi = Math.abs(wAvg - medianMidi) <= 0.65 ? wAvg : medianMidi;

    // Measure longest continuous steady core only when pitchTrack has sufficient frame density (>= 5 frames)
    if (pts.length >= 5) {
      let runStart = -1;
      let maxCoreMs = 0;
      let prevDelta = 0;
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        const inBand =
          p.volumeDb >= peakDb - 16 &&
          (melismaNotesCount >= 2 || Math.abs(p.midi - exactMidi) <= 0.65);
        if (inBand) {
          if (runStart < 0) runStart = p.timeMs;
          const curSpan = p.timeMs - runStart;
          if (curSpan > maxCoreMs) maxCoreMs = curSpan;
        } else {
          runStart = -1;
        }
        if (k > 0) {
          const d = p.midi - pts[k - 1].midi;
          if (Math.abs(d) > 0.05) {
            if (prevDelta * d < 0) vibratoOscillations++;
            prevDelta = d;
          }
        }
      }
      sustainCoreMs = Math.round(maxCoreMs);
    } else {
      sustainCoreMs = Math.max(40, wEnd - wStart);
    }
  } else {
    // No pitchTrack available (e.g. light mock tests): fallback to full word span
    sustainCoreMs = Math.max(40, wEnd - wStart);
  }

  const nominalMidi = Math.round(exactMidi);
  const info = midiToCompactSolfege(nominalMidi);

  let sustainKind: 'steady_hold' | 'vibrato_hold' | 'melisma_glide' | 'clipped' | undefined;
  if (melismaNotesCount >= 2) {
    sustainKind = 'melisma_glide';
  } else if (isCheckedStop && sustainCoreMs < 480) {
    sustainKind = 'clipped';
  } else if (sustainCoreMs >= 520) {
    sustainKind = vibratoOscillations >= 4 ? 'vibrato_hold' : 'steady_hold';
  } else if (wEnd - wStart <= 280) {
    sustainKind = 'clipped';
  }

  return {
    midi: nominalMidi,
    exactMidi: Math.round(exactMidi * 100) / 100,
    noteName: info.noteName,
    solfege: info.solfege,
    sustainCoreMs,
    sustainKind,
  };
}

/**
 * Acoustic-Phonetic Frame-Level Forced Aligner ("Dính từng chữ"):
 * Delegates to the 2-State (`SIL` + `WORD`) Anchor-Pinned Syllable-Nucleus Viterbi aligner
 * in `acousticWordForcedAligner.ts` so one off-sync or held word never cascades onto neighbors.
 */
function forceAlignPhraseWordsAcoustically(params: {
  phrase: IVocalPhrase;
  phraseBars: IVocalNoteBar[];
  allNoteBars: IVocalNoteBar[];
  words: IVocalLyricWord[];
  rawTokens: string[];
  rawMonoPcm: Float32Array;
  sampleRate: number;
  pitchTrack: IReferencePitchPoint[];
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  splitNoteBarsToMatch?: boolean;
}): void {
  runAcousticWordForcedAlignment({
    ...params,
    deps: {
      goertzelBandEnergy,
      computeOralToNasalRatioDbAtMs,
      computeWordIntrinsicDurationWeight,
      decomposeVietnameseWordPhoneticStates,
      extractVietnameseWordVowel,
      extractVietnameseToneContour,
      computeWordAcousticStats,
      getPhraseNoteBarsStrict,
      splitSingleBarAtMs,
    },
  });
}

/**
 * Align a lyric string (or deep vowel-trajectory tokens) onto the discrete NoteBars belonging to a Phrase.
 * Combines:
 * - Attack-scoop absorption & Syllable-dip NoteBar subdivision (distinguishing 2 same-pitch words from 1 sustained note)
 * - Phonology, Sustain & Legato-Glide Dynamic Programming when $B \ge W$
 * - Multi-note glide (`C4→E4`, `từ thấp lên cao`) and sustained duration (`Ngân 1.2s`, `nốt ngân lâu hơn`) tracking per word
 */
export function alignWordsToPhraseNoteBars(
  phrase: IVocalPhrase,
  allNoteBars: IVocalNoteBar[],
  lyricText?: string,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = [],
  wordTimestamps?: Array<{ timeMs: number; text: string }>,
  preserveCanvasBars = false
): void {
  const cleanCustomText =
    lyricText && !lyricText.startsWith('Nguyên âm:') ? lyricText.trim() : '';

  const tokenPairs =
    cleanCustomText.length > 0
      ? cleanCustomText
          .split(/\s+/)
          .map((raw) => ({
            raw,
            clean: raw.replace(/^[()[\]{}“"‘'«]+|[()[\]{}“"‘'».,;:!?]+$/g, '').trim(),
          }))
          .filter((p) => p.clean.length > 0)
      : [];
  const customTokens = tokenPairs.map((p) => p.clean);
  const customPunctTokens = tokenPairs.map((p) => p.raw);

  let phraseBars = getPhraseNoteBarsStrict(phrase, allNoteBars);

  // Run intelligent syllable-dip subdivision & micro-scoop fusion whenever we have multi-word lyrics
  // (skipped when preserveCanvasBars === true so manual Canvas split/merge/drag is respected)
  if (!preserveCanvasBars && customTokens.length > 1 && phraseBars.length > 0) {
    phraseBars = subdivideSustainedBarsForWords(
      phraseBars,
      allNoteBars,
      customTokens.length,
      pitchTrack,
      rawMonoPcm,
      sampleRate,
      wordTimestamps
    );
  }

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

  const effectiveText =
    cleanCustomText.length > 0
      ? cleanCustomText
      : phrase.isInstrumentalOrVocalize
      ? '🎵 Đoạn ngân / Không lời (Vocalize)'
      : phrase.acousticText;

  phrase.lyricText = effectiveText;

  const rawTokens =
    customTokens.length > 0
      ? customTokens
      : vowelTrajectoryTokens.length > 0
      ? vowelTrajectoryTokens
      : ['A→'];
  const rawPunctTokens =
    customPunctTokens.length > 0 ? customPunctTokens : rawTokens;

  const words: IVocalLyricWord[] = [];

  if (phraseBars.length === 0) {
    const totalDur = Math.max(200, phrase.endMs - phrase.startMs);
    const step = totalDur / Math.max(1, rawTokens.length);
    rawTokens.forEach((tk, i) => {
      const info = midiToCompactSolfege(phrase.avgMidi);
      const ortho = customTokens.length > 0 ? extractVietnameseWordVowel(tk) : null;
      const wStart = Math.round(phrase.startMs + i * step);
      const wEnd = Math.round(phrase.startMs + (i + 1) * step);
      words.push({
        wordIndex: i,
        text: tk,
        solfege: info.solfege,
        noteName: info.noteName,
        midi: Math.round(phrase.avgMidi),
        startMs: wStart,
        endMs: wEnd,
        durationMs: Math.max(50, wEnd - wStart),
        noteSequence: [info.noteName],
        solfegeSequence: [info.solfege],
        melismaNotesCount: 1,
        glideSemitones: 0,
        vowelPhoneme: ortho?.vowelPhoneme || 'A',
        vowelHint: ortho?.vowelHint || 'A (Mở rộng hàm)',
        pitchTrajectory: 'steady',
        trajectorySymbol: '→',
        trajectoryLabel: '→ Giữ độ cao',
        stepSemitones: 0,
        intraBendCents: 0,
        pitchCurveCents: [0, 0, 0],
      });
    });
  } else if (rawTokens.length <= phraseBars.length) {
    // Use Phonology, Sustain & Legato-aware Dynamic Programming to map words onto NoteBars
    const barRanges = partitionBarsToWordsDP(
      phraseBars,
      barAnalysisList,
      rawPunctTokens,
      pitchTrack,
      wordTimestamps,
      rawMonoPcm,
      sampleRate
    );

    rawTokens.forEach((tk, i) => {
      const { startBarIdx, endBarIdx } = barRanges[i] || {
        startBarIdx: Math.min(i, phraseBars.length - 1),
        endBarIdx: Math.min(i, phraseBars.length - 1),
      };
      const firstBar = phraseBars[startBarIdx];
      const lastBar = phraseBars[endBarIdx];
      const ac = barAnalysisList[startBarIdx];
      const lastAc = barAnalysisList[endBarIdx];
      const ortho = customTokens.length > 0 ? extractVietnameseWordVowel(tk) : null;

      const resolvedVowel = ortho ? ortho.vowelPhoneme : ac.vowelPhoneme;
      const resolvedHint = ortho ? ortho.vowelHint : ac.vowelHint;

      // Build distinct consecutive note & solfege sequences across the bars spanned by this word
      const noteSequence: string[] = [];
      const solfegeSequence: string[] = [];
      for (let bIdx = startBarIdx; bIdx <= endBarIdx; bIdx++) {
        const bAc = barAnalysisList[bIdx];
        if (noteSequence[noteSequence.length - 1] !== bAc.noteName) {
          noteSequence.push(bAc.noteName);
          solfegeSequence.push(bAc.solfege);
        }
      }

      let melismaSymbol = ac.trajectorySymbol;
      let melismaLabel = ac.trajectoryLabel;
      let wordTrajectory: VowelPitchTrajectory = ac.pitchTrajectory;
      let wordIntraBendCents = ac.intraBendCents;
      let wordPitchCurve = ac.pitchCurveCents;
      let endNoteName: string | undefined =
        lastBar.noteName !== firstBar.noteName ? lastBar.noteName : undefined;
      let endSolfege: string | undefined =
        lastAc.solfege !== ac.solfege ? lastAc.solfege : undefined;
      let endMidi: number | undefined =
        lastBar.midi !== firstBar.midi ? lastBar.midi : undefined;
      let glideSemitones = lastBar.midi - firstBar.midi;

      if (endBarIdx > startBarIdx) {
        const netMelisma = lastBar.midi - firstBar.midi;
        wordIntraBendCents = Math.round((lastBar.exactMidi - firstBar.exactMidi) * 100);
        const midBar = phraseBars[Math.floor((startBarIdx + endBarIdx) / 2)];
        wordPitchCurve = [
          0,
          Math.round((midBar.exactMidi - firstBar.exactMidi) * 100),
          wordIntraBendCents,
        ];
        if (netMelisma > 0) {
          melismaSymbol = '⤴';
          wordTrajectory = 'rising';
          melismaLabel = `⤴ Luyến từ thấp lên cao (${noteSequence.join('→')}, +${netMelisma} bán âm)`;
        } else if (netMelisma < 0) {
          melismaSymbol = '⤵';
          wordTrajectory = 'falling';
          melismaLabel = `⤵ Luyến từ cao xuống thấp (${noteSequence.join('→')}, ${netMelisma} bán âm)`;
        } else {
          melismaSymbol = noteSequence.length > 1 ? '⤴' : '〰';
          wordTrajectory = noteSequence.length > 1 ? 'arch' : 'vibrato';
          melismaLabel = `${melismaSymbol} Luyến ${endBarIdx - startBarIdx + 1} nốt (${noteSequence.join('→')})`;
        }
      } else if (Math.abs(ac.intraBendCents) >= 80) {
        // Single NoteBar with strong intra-note pitch glide (>= 0.8 semitones from start to end of the vowel)
        const glideSt = Math.round(ac.intraBendCents / 100);
        if (glideSt !== 0) {
          const startTargetMidi =
            glideSt > 0 ? firstBar.midi - Math.abs(glideSt) : firstBar.midi + Math.abs(glideSt);
          const startInfo = midiToCompactSolfege(startTargetMidi);
          if (startInfo.noteName !== ac.noteName) {
            glideSemitones = glideSt;
            endNoteName = ac.noteName;
            endSolfege = ac.solfege;
            endMidi = firstBar.midi;
            noteSequence.splice(0, noteSequence.length, startInfo.noteName, ac.noteName);
            solfegeSequence.splice(0, solfegeSequence.length, startInfo.solfege, ac.solfege);
            melismaLabel =
              glideSt > 0
                ? `↗ Vuốt từ thấp lên cao (${startInfo.noteName}→${ac.noteName}, +${ac.intraBendCents}c)`
                : `↘ Vuốt từ cao xuống thấp (${startInfo.noteName}→${ac.noteName}, ${ac.intraBendCents}c)`;
          }
        }
      }

      firstBar.lyricSyllable = tk.includes(melismaSymbol) ? tk : `${tk}${melismaSymbol}`;
      firstBar.vowelHint = resolvedHint;
      for (let bIdx = startBarIdx + 1; bIdx <= endBarIdx; bIdx++) {
        const subAc = barAnalysisList[bIdx];
        phraseBars[bIdx].lyricSyllable = `~${resolvedVowel}${subAc.trajectorySymbol}`;
        phraseBars[bIdx].vowelHint = resolvedHint;
      }

      const wDur = Math.max(50, lastBar.endTimeMs - firstBar.startTimeMs);
      const localStats = computeWordAcousticStats(
        firstBar.startTimeMs,
        lastBar.endTimeMs,
        pitchTrack,
        firstBar.midi,
        Boolean(ortho?.isCheckedStop),
        endBarIdx - startBarIdx + 1
      );

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac.solfege,
        noteName: ac.noteName,
        midi: firstBar.midi,
        startMs: firstBar.startTimeMs,
        endMs: lastBar.endTimeMs,
        durationMs: wDur,
        sustainCoreMs: localStats.sustainCoreMs,
        sustainKind: localStats.sustainKind,
        endNoteName,
        endSolfege,
        endMidi,
        noteSequence,
        solfegeSequence,
        melismaNotesCount: endBarIdx - startBarIdx + 1,
        glideSemitones,
        vowelPhoneme: resolvedVowel,
        vowelHint: resolvedHint,
        formantsHz: ac.formantsHz,
        pitchTrajectory: wordTrajectory,
        trajectorySymbol: melismaSymbol,
        trajectoryLabel: melismaLabel,
        stepSemitones: ac.stepSemitones,
        intraBendCents: wordIntraBendCents,
        pitchCurveCents: wordPitchCurve,
      });
    });
  } else {
    // Sub-bar Frame-Level Phonetic-Duration & Energy-Valley Viterbi Alignment
    // when multiple rapid words share a NoteBar ($W > B$)
    // Dynamically assign words based on NoteBar duration proportionality & word phonology weights
    const wordWeights = rawPunctTokens.map((tk, idx) =>
      computeWordIntrinsicDurationWeight(tk, idx === rawPunctTokens.length - 1)
    );
    const totalWordWeight = wordWeights.reduce((s, w) => s + w, 0) || 1;
    const totalBarsDuration = phraseBars.reduce((s, b) => s + b.durationMs, 0) || 1000;

    const barWordGroups: number[][] = Array.from({ length: phraseBars.length }, () => []);

    let accumWeight = 0;
    rawTokens.forEach((_, i) => {
      const wordMidFrac = (accumWeight + wordWeights[i] * 0.5) / totalWordWeight;
      accumWeight += wordWeights[i];

      // Piecewise active-time interpolation along phraseBars so inter-bar silence gaps never shift targets early!
      let activeTargetRemaining = wordMidFrac * totalBarsDuration;
      let weightTargetMs = phraseBars[phraseBars.length - 1].endTimeMs;
      for (let b = 0; b < phraseBars.length; b++) {
        if (activeTargetRemaining <= phraseBars[b].durationMs || b === phraseBars.length - 1) {
          weightTargetMs =
            phraseBars[b].startTimeMs +
            Math.max(0, Math.min(phraseBars[b].durationMs, activeTargetRemaining));
          break;
        }
        activeTargetRemaining -= phraseBars[b].durationMs;
      }

      const tsAnchorMs = wordTimestamps?.[i]?.timeMs;
      const targetTimeMs =
        tsAnchorMs !== undefined &&
        Number.isFinite(tsAnchorMs) &&
        tsAnchorMs >= phraseBars[0].startTimeMs - 400 &&
        tsAnchorMs <= phraseBars[phraseBars.length - 1].endTimeMs + 400
          ? tsAnchorMs
          : weightTargetMs;

      let bestBarIdx = 0;
      let minDistance = Infinity;
      for (let b = 0; b < phraseBars.length; b++) {
        const bar = phraseBars[b];
        if (targetTimeMs >= bar.startTimeMs && targetTimeMs <= bar.endTimeMs) {
          bestBarIdx = b;
          break;
        }
        const barMid = (bar.startTimeMs + bar.endTimeMs) / 2;
        const dist = Math.abs(barMid - targetTimeMs);
        if (dist < minDistance) {
          minDistance = dist;
          bestBarIdx = b;
        }
      }
      barWordGroups[bestBarIdx].push(i);
    });

    // Ensure every bar gets at least one word if words >= bars, preserving chronological ordering
    if (rawTokens.length >= phraseBars.length) {
      for (let b = 0; b < phraseBars.length; b++) {
        if (barWordGroups[b].length === 0) {
          if (b > 0 && barWordGroups[b - 1].length >= 2) {
            const stolen = barWordGroups[b - 1].pop()!;
            barWordGroups[b].push(stolen);
          } else if (b < phraseBars.length - 1 && barWordGroups[b + 1].length >= 2) {
            const stolen = barWordGroups[b + 1].shift()!;
            barWordGroups[b].push(stolen);
          }
        }
      }
    }

    barWordGroups.forEach((tokenIndices, mappedBarIdx) => {
      if (tokenIndices.length === 0) return;
      const bar = phraseBars[mappedBarIdx];
      const ac = barAnalysisList[mappedBarIdx];
      const weights = tokenIndices.map((tIdx) =>
        computeWordIntrinsicDurationWeight(
          rawPunctTokens[tIdx],
          tIdx === rawPunctTokens.length - 1
        )
      );
      const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;
      const barPts = pitchTrack.filter(
        (pt) => pt.timeMs >= bar.startTimeMs && pt.timeMs <= bar.endTimeMs
      );

      // Compute optimal internal boundaries [bar.startTimeMs, b_1, ..., b_{k-1}, bar.endTimeMs]
      const boundaries: number[] = [bar.startTimeMs];
      let accumWeight = 0;
      for (let subIdx = 0; subIdx < tokenIndices.length - 1; subIdx++) {
        accumWeight += weights[subIdx];
        const expectedBoundaryMs =
          bar.startTimeMs + (accumWeight / totalWeight) * bar.durationMs;
        const prevBound = boundaries[boundaries.length - 1];
        const minAllowMs = prevBound + 35;
        const maxAllowMs =
          bar.endTimeMs - (tokenIndices.length - 1 - subIdx) * 35;

        let snappedMs = Math.round(
          Math.max(minAllowMs, Math.min(maxAllowMs, expectedBoundaryMs))
        );
        const searchWindowMs = Math.max(25, (bar.durationMs / tokenIndices.length) * 0.35);

        if (barPts.length >= 3) {
          let bestValleyScore = -Infinity;
          for (const pt of barPts) {
            if (
              pt.timeMs < Math.max(minAllowMs, expectedBoundaryMs - searchWindowMs) ||
              pt.timeMs > Math.min(maxAllowMs, expectedBoundaryMs + searchWindowMs)
            ) {
              continue;
            }
            const distPenalty = Math.abs(pt.timeMs - expectedBoundaryMs) * 0.04;
            const onsetBoost = Math.min(7.0, (pt.onsetStrength || 0) * 1.15);
            const valleyScore =
              -pt.volumeDb * 0.8 + (1 - pt.clarity) * 12 + onsetBoost - distPenalty;
            if (valleyScore > bestValleyScore) {
              bestValleyScore = valleyScore;
              snappedMs = Math.round(pt.timeMs);
            }
          }
        }
        boundaries.push(snappedMs);
      }
      boundaries.push(bar.endTimeMs);

      tokenIndices.forEach((i, subIndex) => {
        const tk = rawTokens[i];
        const ortho = customTokens.length > 0 ? extractVietnameseWordVowel(tk) : null;
        const resolvedVowel = ortho ? ortho.vowelPhoneme : ac.vowelPhoneme;
        const resolvedHint = ortho ? ortho.vowelHint : ac.vowelHint;

        if (subIndex === 0) {
          bar.lyricSyllable = `${tk}${ac.trajectorySymbol}`;
          bar.vowelHint = resolvedHint;
        } else if (bar.lyricSyllable && !bar.lyricSyllable.includes(` ${tk}`)) {
          bar.lyricSyllable = `${bar.lyricSyllable} ${tk}`;
        }

        const wStart = boundaries[subIndex];
        const wEnd = Math.max(wStart + 30, boundaries[subIndex + 1]);
        const localStats = computeWordAcousticStats(
          wStart,
          wEnd,
          pitchTrack,
          bar.midi,
          Boolean(ortho?.isCheckedStop),
          1
        );

        words.push({
          wordIndex: i,
          text: tk,
          solfege: localStats.solfege,
          noteName: localStats.noteName,
          midi: localStats.midi,
          startMs: wStart,
          endMs: wEnd,
          durationMs: Math.max(40, wEnd - wStart),
          sustainCoreMs: localStats.sustainCoreMs,
          sustainKind: localStats.sustainKind,
          noteSequence: [localStats.noteName],
          solfegeSequence: [localStats.solfege],
          melismaNotesCount: 1,
          glideSemitones: 0,
          vowelPhoneme: resolvedVowel,
          vowelHint: resolvedHint,
          formantsHz: ac.formantsHz,
          pitchTrajectory: ac.pitchTrajectory,
          trajectorySymbol: ac.trajectorySymbol,
          trajectoryLabel: ac.trajectoryLabel,
          stepSemitones: subIndex === 0 ? ac.stepSemitones : 0,
          intraBendCents: ac.intraBendCents,
          pitchCurveCents: ac.pitchCurveCents,
        });
      });
    });
  }

  // Frame-Level Acoustic-Phonetic Forced Alignment ("Dính từng chữ") when real modulated vocal PCM is available
  if (
    customTokens.length >= 2 &&
    words.length === customTokens.length &&
    phraseBars.length > 0 &&
    rawMonoPcm &&
    rawMonoPcm.length >= 512
  ) {
    forceAlignPhraseWordsAcoustically({
      phrase,
      phraseBars,
      allNoteBars,
      words,
      rawTokens: rawPunctTokens,
      rawMonoPcm,
      sampleRate,
      pitchTrack,
      wordTimestamps,
      splitNoteBarsToMatch: !preserveCanvasBars,
    });
  }

  // Post-process word durations using steady vowel sustain core (eliminating false sustain on checked-stops & decaying tails)
  if (words.length > 0) {
    const sortedWordDurs = words
      .map((w) => w.sustainCoreMs ?? w.durationMs ?? Math.max(50, w.endMs - w.startMs))
      .sort((a, b) => a - b);
    const medianWordDur = sortedWordDurs[Math.floor(sortedWordDurs.length / 2)] || 300;

    words.forEach((w) => {
      const dur = w.durationMs || Math.max(50, w.endMs - w.startMs);
      w.durationMs = dur;
      const coreDur = w.sustainCoreMs ?? dur;
      if (w.sustainKind === 'clipped') {
        w.isSustained = false;
        w.sustainLabel = undefined;
      } else if (coreDur >= 560 && (coreDur >= medianWordDur * 1.35 || coreDur >= 800)) {
        w.isSustained = true;
        w.sustainLabel = `Ngân ${(coreDur / 1000).toFixed(1)}s`;
      }
    });

    // Enrich each word with Vietnamese Tone & Prosody Metadata
    words.forEach((w, idx) => {
      const toneInfo = getVietnameseToneInfo(w.text);
      w.toneType = toneInfo.toneType;
      w.toneRank = toneInfo.toneRank;
      w.toneNameVi = toneInfo.toneNameVi;

      if (idx > 0) {
        const tr = computeToneMelodicTransitionCost(
          words[idx - 1].text,
          w.text,
          words[idx - 1].midi,
          w.midi
        );
        w.toneMelodicConcordance = tr.isInverted
          ? 'inverted'
          : tr.isConcordant
          ? 'concordant'
          : 'neutral';
      } else {
        w.toneMelodicConcordance = 'neutral';
      }
    });

    const harmonyReport = computePhraseToneMelodicHarmony(
      words.map((w) => w.text),
      words.map((w) => w.midi)
    );
    phrase.toneHarmonyScore = harmonyReport.overallScorePercent;
    phrase.toneHarmonyFeedback = harmonyReport.detailedFeedbackVi;
  }

  phrase.words = words;
}

/**
 * Parse LRC formatted text (`[mm:ss.xx] Lyric line`) into timestamped lines,
 * automatically filtering out non-sung metadata/credit lines (`[ar:...]`, `Ca sĩ:`, `Sáng tác:`).
 */
function isIgnoredSubtitleMetadataLine(textContent: string): boolean {
  if (!textContent) return true;
  if (
    /^(?:bài hát|ca sĩ|sáng tác|nhạc sĩ|lời bài hát|lyric(?:ist)?(?:\s+by)?|synced\s+by|biểu diễn|tác giả|producer|arrangement|ti|ar|al|au|by|re|ve|length|composer|beat|mix|master|vocal)\s*[:\-]/i.test(
      textContent
    ) ||
    /^[\[(](?:verse|chorus|pre-?chorus|bridge|intro|outro|điệp khúc|phiên khúc|rap|instrumental|music|âm\s*nhạc|nhạc|vỗ\s*tay|cười|applause|laughter).*?[\])]$/i.test(
      textContent
    )
  ) {
    return true;
  }
  const normalized =
    textContent.replace(/[~♪*.\[\]()\s]+/g, '').length === 0
      ? '~'
      : textContent.replace(/^[\[(]|[\])]$/g, '').replace(/[.…]+$/g, '').trim();
  return /^(?:nhạc dạo|giang tấu|dạo nhạc|kết thúc|âm\s*nhạc|nhạc|vỗ\s*tay|cười|instrumental|music|applause|laughter|intro|outro|interlude|\.{2,}|~+|♪+|\*+)$/i.test(
    normalized
  );
}

function parseFlexTimestampToMs(hStr: string | undefined, mStr: string, sStr: string, fracStr?: string): number {
  const h = hStr ? parseInt(hStr, 10) : 0;
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);
  const f = fracStr || '0';
  const ms =
    f.length === 1
      ? parseInt(f, 10) * 100
      : f.length === 2
      ? parseInt(f, 10) * 10
      : parseInt(f.slice(0, 3), 10);
  return h * 3600000 + m * 60000 + s * 1000 + ms;
}

/**
 * Parse LRC (`[mm:ss.xx]`), Enhanced LRC (`<mm:ss.xx>`), WebVTT/SRT (`-->`),
 * YouTube Transcript copy-paste (`0:13` / `0:13 text`), and YouTube `json3` captions,
 * automatically filtering out non-sung metadata/credit lines (`[ar:...]`, `Ca sĩ:`, `Sáng tác:`).
 */
export function parseLrcContent(lrcText: string): ILrcLine[] {
  const trimmed = lrcText.trim();
  if (!trimmed) return [];

  // 1. Try YouTube JSON3 caption format ({ events: [{ tStartMs, segs: [{ utf8 }] }] })
  if (trimmed.startsWith('{') && trimmed.includes('"events"')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (Array.isArray(parsedJson?.events)) {
        const outJson: ILrcLine[] = [];
        for (const ev of parsedJson.events) {
          if (typeof ev?.tStartMs !== 'number' || !Array.isArray(ev?.segs)) continue;
          const text = ev.segs
            .map((s: any) => (typeof s?.utf8 === 'string' ? s.utf8 : ''))
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
          if (!isIgnoredSubtitleMetadataLine(text)) {
            outJson.push({ timeMs: Math.max(0, Math.round(ev.tStartMs)), text });
          }
        }
        if (outJson.length > 0) {
          outJson.sort((a, b) => a.timeMs - b.timeMs);
          return outJson;
        }
      }
    } catch {
      // Fall through to text parsers
    }
  }

  const lines = lrcText.split(/\r?\n/);

  // 2. Try SRT / WebVTT cue format (`00:00:13,840 --> 00:00:15,720` or `00:13.840 --> 00:15.720`)
  const srtCueRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?\s*-->\s*(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?/;
  if (lines.some((l) => srtCueRegex.test(l.trim()))) {
    const srtOut: ILrcLine[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cueMatch = lines[i].trim().match(srtCueRegex);
      if (!cueMatch) continue;
      const timeMs = parseFlexTimestampToMs(cueMatch[1], cueMatch[2], cueMatch[3], cueMatch[4]);
      const textParts: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '') {
        if (srtCueRegex.test(lines[j].trim())) break;
        const cleaned = lines[j].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned) textParts.push(cleaned);
        j++;
      }
      const joined = textParts.join(' ').trim();
      if (!isIgnoredSubtitleMetadataLine(joined)) {
        srtOut.push({ timeMs: Math.max(0, timeMs), text: joined });
      }
      i = j;
    }
    if (srtOut.length > 0) {
      srtOut.sort((a, b) => a.timeMs - b.timeMs);
      return srtOut;
    }
  }

  // 3. Standard & Enhanced LRC (`[mm:ss.xx]` / `<mm:ss.xx>`)
  const result: ILrcLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const inlineWordRegex = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>\s*([^<]+)/g;
  const offsetTagRegex = /\[offset\s*:\s*([+-]?\d+)\]/i;

  let globalTagOffsetMs = 0;
  for (const rawLine of lines) {
    const offMatch = rawLine.match(offsetTagRegex);
    if (offMatch) {
      globalTagOffsetMs = parseInt(offMatch[1], 10) || 0;
      break;
    }
  }

  for (const rawLine of lines) {
    const matches = [...rawLine.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    const withoutLineTags = rawLine.replace(timeRegex, '').trim();
    const inlineMatches = [...withoutLineTags.matchAll(inlineWordRegex)];
    let parsedWordTimestamps: Array<{ timeMs: number; text: string }> | undefined;

    if (inlineMatches.length > 0) {
      parsedWordTimestamps = [];
      for (const wm of inlineMatches) {
        const wMin = parseInt(wm[1], 10);
        const wSec = parseInt(wm[2], 10);
        const wFrac = wm[3] || '0';
        const wMs =
          wFrac.length === 1
            ? parseInt(wFrac, 10) * 100
            : wFrac.length === 2
            ? parseInt(wFrac, 10) * 10
            : parseInt(wFrac.slice(0, 3), 10);
        const wTimeMs = Math.max(0, wMin * 60000 + wSec * 1000 + wMs + globalTagOffsetMs);
        const subWords = wm[4].trim().split(/\s+/).filter(Boolean);
        subWords.forEach((sw, idx) => {
          parsedWordTimestamps!.push({ timeMs: wTimeMs + idx * 140, text: sw });
        });
      }
    }

    const textContent = withoutLineTags
      .replace(/<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g, ' ')
      .replace(/^\(([^()]+)\)$/, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (isIgnoredSubtitleMetadataLine(textContent)) continue;

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

      const timeMs = Math.max(0, min * 60000 + sec * 1000 + ms + globalTagOffsetMs);
      result.push({
        timeMs,
        text: textContent,
        ...(parsedWordTimestamps && parsedWordTimestamps.length > 0
          ? { wordTimestamps: parsedWordTimestamps }
          : {}),
      });
    }
  }

  if (result.length > 0) {
    result.sort((a, b) => a.timeMs - b.timeMs);
    return result;
  }

  // 4. Fallback: YouTube Transcript copy-paste (`0:14\nLine` or `0:14 Line` or `1:02:15 Line`)
  const ytTimeOnlyRegex = /^(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)(?:[.,](\d{1,3}))?$/;
  const ytInlineRegex = /^(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)(?:[.,](\d{1,3}))?\s+(.+)$/;
  const ytOut: ILrcLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const tLine = lines[i].trim();
    if (!tLine) continue;
    const inlineM = tLine.match(ytInlineRegex);
    if (inlineM) {
      const timeMs = parseFlexTimestampToMs(inlineM[1], inlineM[2], inlineM[3], inlineM[4]);
      const text = inlineM[5].replace(/\s+/g, ' ').trim();
      if (!isIgnoredSubtitleMetadataLine(text)) {
        ytOut.push({ timeMs, text });
      }
      continue;
    }
    const soloM = tLine.match(ytTimeOnlyRegex);
    if (soloM && i + 1 < lines.length) {
      const nextText = lines[i + 1].trim();
      if (nextText && !ytTimeOnlyRegex.test(nextText)) {
        const timeMs = parseFlexTimestampToMs(soloM[1], soloM[2], soloM[3], soloM[4]);
        const cleaned = nextText.replace(/\s+/g, ' ').trim();
        if (!isIgnoredSubtitleMetadataLine(cleaned)) {
          ytOut.push({ timeMs, text: cleaned });
        }
        i++;
      }
    }
  }

  if (ytOut.length >= 2) {
    ytOut.sort((a, b) => a.timeMs - b.timeMs);
    return ytOut;
  }

  return [];
}

/**
 * Auto-calibrate global time offset $\Delta t$ (in ms) between LRC timestamps and actual vocal onsets
 * in `noteBars` / `phrases` (handles vocal stems or Part_1 cuts that start earlier/later than the LRC,
 * while strictly protecting full-beat tracks with instrumental intros from shifting lyrics early onto the beat!).
 */
export function estimateOptimalLrcOffsetMs(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  _audioDurationMs?: number
): number {
  if (phrases.length === 0 || lrcLines.length === 0) return 0;

  // Collect deduplicated phrase start times and post-pause noteBar onset times
  const rawOnsets: number[] = phrases.map((p) => p.startMs);
  for (let i = 1; i < noteBars.length; i++) {
    if (noteBars[i].startTimeMs - noteBars[i - 1].endTimeMs >= 200) {
      rawOnsets.push(noteBars[i].startTimeMs);
    }
  }
  rawOnsets.sort((a, b) => a - b);
  const vocalOnsets: number[] = [];
  for (const on of rawOnsets) {
    if (vocalOnsets.length === 0 || on - vocalOnsets[vocalOnsets.length - 1] >= 120) {
      vocalOnsets.push(on);
    }
  }

  // Find the first substantial vocal phrase (>= 400ms with melodic variety, not a flat 0-semitone drone)
  const hasMelody = (p: IVocalPhrase) =>
    (p.notes?.length || 0) >= 2 || p.lowestNote !== p.highestNote || (p.pitchJumpSemitones || 0) >= 2;

  const firstSubstantialPhrase =
    phrases.find((p) => !p.isInstrumentalOrVocalize && p.durationMs >= 400 && hasMelody(p)) ||
    phrases.find((p) => !p.isInstrumentalOrVocalize && p.durationMs >= 400) ||
    phrases[0];
  const firstVocalOnset = firstSubstantialPhrase?.startMs ?? (noteBars[0]?.startTimeMs ?? 0);
  const firstLrcOnset = lrcLines[0]?.timeMs ?? 0;
  const leadDiff = firstVocalOnset - firstLrcOnset;

  const candidateOffsets = new Set<number>([0]);

  // Always test zero and fine-grained offsets around 0
  for (let delta = -800; delta <= 800; delta += 100) {
    candidateOffsets.add(delta);
  }

  // If there is an offset between first vocal onset and first LRC line
  // (e.g. 24s empty lead-in in audio, or pre-trimmed stem where intro was cut),
  // test candidate offsets centered around leadDiff
  if (Math.abs(leadDiff) >= 500 && Math.abs(leadDiff) <= 45000) {
    const roundedLead = Math.round(leadDiff / 50) * 50;
    candidateOffsets.add(roundedLead);
    for (let delta = -1500; delta <= 1500; delta += 100) {
      candidateOffsets.add(roundedLead + delta);
    }
  }

  // Also test candidate offsets from first phrase start
  const firstPhraseDiff = phrases[0].startMs - lrcLines[0].timeMs;
  if (Math.abs(firstPhraseDiff) <= 35000) {
    const roundedFirstDiff = Math.round(firstPhraseDiff / 50) * 50;
    candidateOffsets.add(roundedFirstDiff);
    for (let delta = -1000; delta <= 1000; delta += 100) {
      candidateOffsets.add(roundedFirstDiff + delta);
    }
  }

  // Multi-Region Consensus Pairwise Onset-Difference Histogram:
  // Samples both opening onsets AND evenly-spaced onsets/lines across the entire song so neither
  // early missing prefixes nor a single repeated later chorus can bias global offset calibration.
  const pickSampleIndices = (len: number, maxTotal: number): number[] => {
    const idxSet = new Set<number>();
    const headCount = Math.min(8, len);
    for (let i = 0; i < headCount; i++) idxSet.add(i);
    if (len > headCount) {
      const remainingBudget = Math.max(1, maxTotal - headCount);
      for (let s = 0; s < remainingBudget; s++) {
        const idx = headCount + Math.floor(((s + 0.5) / remainingBudget) * (len - headCount));
        if (idx < len) idxSet.add(idx);
      }
    }
    return [...idxSet].sort((a, b) => a - b);
  };

  const sampledOnsets = pickSampleIndices(vocalOnsets.length, 28);
  const sampledLrc = pickSampleIndices(lrcLines.length, 28);
  const offsetBins = new Map<number, number>();
  for (const vi of sampledOnsets) {
    for (const li of sampledLrc) {
      const diff = vocalOnsets[vi] - lrcLines[li].timeMs;
      if (Math.abs(diff) > 45000) continue;
      const bin = Math.round(diff / 250) * 250;
      offsetBins.set(bin, (offsetBins.get(bin) || 0) + 1);
    }
  }
  const topConsensusBins = [...offsetBins.entries()]
    .sort((a, b) => b[1] - a[1] || Math.abs(a[0]) - Math.abs(b[0]))
    .slice(0, 6)
    .map(([bin]) => bin);
  for (const bin of topConsensusBins) {
    candidateOffsets.add(bin);
    for (let delta = -600; delta <= 600; delta += 150) {
      candidateOffsets.add(bin + delta);
    }
  }

  let bestOffset = 0;
  let bestScore = -Infinity;

  for (const offset of candidateOffsets) {
    // Light penalty for large offsets to break ties in favor of smaller offsets
    let score = -Math.abs(offset) * 0.003;

    for (let i = 0; i < lrcLines.length; i++) {
      const shiftedStart = lrcLines[i].timeMs + offset;
      // Shifting LRC lines far before t = 0s (< -1200ms) indicates an invalid over-negative offset
      if (shiftedStart < -1200) {
        score -= 28;
        continue;
      }
      const shiftedEnd =
        i + 1 < lrcLines.length
          ? Math.min(lrcLines[i + 1].timeMs + offset, shiftedStart + 5500)
          : shiftedStart + 4500;

      // 1. Proximity of shiftedStart to nearest vocal onset
      let minOnsetDist = Infinity;
      for (const onset of vocalOnsets) {
        const d = Math.abs(onset - shiftedStart);
        if (d < minOnsetDist) minOnsetDist = d;
      }
      if (minOnsetDist <= 850) {
        score += (850 - minOnsetDist) * 0.035;
      }

      // 2. Check if this LRC window covers actual sung noteBars
      const hasBars = noteBars.some((b) => {
        const mid = (b.startTimeMs + b.endTimeMs) / 2;
        return mid >= shiftedStart - 120 && mid <= shiftedEnd + 120;
      });
      if (hasBars) {
        score += 20;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  // Sub-frame fine-tuning pass around bestOffset with step 25ms in [-75ms, +75ms]
  let refinedOffset = bestOffset;
  let refinedScore = bestScore;
  for (let delta = -75; delta <= 75; delta += 25) {
    if (delta === 0) continue;
    const testOffset = bestOffset + delta;
    let score = -Math.abs(testOffset) * 0.003;
    for (let i = 0; i < lrcLines.length; i++) {
      const shiftedStart = lrcLines[i].timeMs + testOffset;
      let minOnsetDist = Infinity;
      for (const onset of vocalOnsets) {
        const d = Math.abs(onset - shiftedStart);
        if (d < minOnsetDist) minOnsetDist = d;
      }
      if (minOnsetDist <= 850) {
        score += (850 - minOnsetDist) * 0.035;
      }
    }
    if (score > refinedScore) {
      refinedScore = score;
      refinedOffset = testOffset;
    }
  }

  return refinedOffset;
}

/**
 * Manually nudge/shift all lyric timestamps and phrase boundaries by deltaMs (e.g. +200ms or -200ms).
 * Enables real-time fine-tuning directly on HUD or Deck.
 */
export function nudgeLyricOffset(
  analysisResult: IVocalAnalysisResult,
  deltaMs: number
): IVocalAnalysisResult {
  if (Math.abs(deltaMs) < 10) return analysisResult;

  const shiftedPhrases = analysisResult.phrases.map((p) => {
    const newStart = Math.max(0, p.startMs + deltaMs);
    const newEnd = Math.max(newStart + 100, p.endMs + deltaMs);
    const newWords = p.words?.map((w) => ({
      ...w,
      startMs: Math.max(0, w.startMs + deltaMs),
      endMs: Math.max(0, w.endMs + deltaMs),
    }));

    return {
      ...p,
      startMs: newStart,
      endMs: newEnd,
      words: newWords,
    };
  });

  return {
    ...analysisResult,
    phrases: shiftedPhrases,
  };
}

/**
 * Shift lyric text across phrases by a discrete phrase index delta (+1 = đẩy lyric sang câu sau, -1 = kéo lyric về câu trước).
 * Re-runs `alignWordsToPhraseNoteBars` so all NoteBars, vowels, and Vietnamese tones re-align cleanly!
 */
export function shiftLyricByPhraseCount(
  analysisResult: IVocalAnalysisResult,
  deltaPhrases: number
): IVocalAnalysisResult {
  if (deltaPhrases === 0 || !analysisResult.phrases || analysisResult.phrases.length === 0) {
    return analysisResult;
  }

  const phrases = analysisResult.phrases;
  const n = phrases.length;
  const oldLyrics = phrases.map((p) => p.lyricText || '');

  const newPhrases = phrases.map((p, idx) => {
    const srcIdx = idx - deltaPhrases;
    let newLyric = '';
    if (srcIdx >= 0 && srcIdx < n) {
      newLyric = oldLyrics[srcIdx];
    } else if (srcIdx < 0) {
      newLyric = '🎵 Đoạn dạo đầu / Không lời';
    } else {
      newLyric = p.acousticText || '';
    }

    const updatedP: IVocalPhrase = {
      ...p,
      lyricText: newLyric,
      isInstrumentalOrVocalize: newLyric.startsWith('🎵'),
    };

    alignWordsToPhraseNoteBars(
      updatedP,
      analysisResult.noteBars,
      newLyric,
      null,
      analysisResult.sampleRate,
      analysisResult.pitchTrack
    );
    return updatedP;
  });

  return {
    ...analysisResult,
    phrases: newPhrases,
  };
}

/**
 * Helper to construct a complete IVocalPhrase from a set of NoteBars and a lyric sentence
 */
function buildPhraseFromBarsAndLyric(params: {
  phraseIndex: number;
  bars: IVocalNoteBar[];
  fallbackStartMs: number;
  fallbackEndMs: number;
  lyricText?: string;
  isInstrumentalOrVocalize?: boolean;
  allNoteBars: IVocalNoteBar[];
  rawMonoPcm?: Float32Array | null;
  sampleRate: number;
  pitchTrack: IReferencePitchPoint[];
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  preserveSyntheticText?: boolean;
}): IVocalPhrase {
  const {
    phraseIndex,
    bars,
    fallbackStartMs,
    fallbackEndMs,
    lyricText,
    isInstrumentalOrVocalize,
    allNoteBars,
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    wordTimestamps,
    preserveSyntheticText,
  } = params;

  // Trim leading leftover tail bar or trailing pickup/instrumental interlude bars across breath pauses
  // so the phrase's NoteBars wrap tightly around the exact sung words of this sentence!
  let activeBars = bars;
  if (bars.length >= 2 && lyricText) {
    const wordCount = lyricText.trim().split(/\s+/).filter(Boolean).length;

    // 1. Leading leftover tail bar from previous phrase before a >= 500ms breath pause
    if (
      activeBars.length > wordCount &&
      activeBars[1].startTimeMs - activeBars[0].endTimeMs >= 500
    ) {
      activeBars = activeBars.slice(1);
    }

    // 2. Trailing pickup/interlude/beat bars after a breath gap once the sentence's words are already sung
    const maxSungSpanMs = Math.max(2600, wordCount * 640 + 1600);
    const phraseOriginMs = activeBars[0]?.startTimeMs ?? fallbackStartMs;

    for (let i = 0; i < activeBars.length - 1; i++) {
      const gap = activeBars[i + 1].startTimeMs - activeBars[i].endTimeMs;
      const elapsedMs = activeBars[i + 1].startTimeMs - phraseOriginMs;
      const enoughForAllWords = i + 1 >= wordCount && gap >= 450;
      const enoughForMostWords =
        i + 1 >= Math.max(2, Math.floor(wordCount * 0.65)) && gap >= 950;
      const clearInterPhrasePause = i + 1 >= 2 && gap >= 1350;
      const beyondReasonableSungWindow = elapsedMs > maxSungSpanMs && gap >= 260;

      if (enoughForAllWords || enoughForMostWords || clearInterPhrasePause || beyondReasonableSungWindow) {
        activeBars = activeBars.slice(0, i + 1);
        break;
      }
    }
  }

  const startMs = activeBars.length > 0 ? activeBars[0].startTimeMs : fallbackStartMs;
  const endMs =
    activeBars.length > 0 ? activeBars[activeBars.length - 1].endTimeMs : fallbackEndMs;
  const durationMs = Math.max(200, endMs - startMs);

  let lowestM = 999;
  let highestM = -999;
  let lowestN = 'C4';
  let highestN = 'C4';
  let midiSum = 0;
  let maxLeap = 0;
  let pointsCount = 0;
  const distinctNotes: string[] = [];

  if (activeBars.length > 0) {
    activeBars.forEach((b, idx) => {
      if (!distinctNotes.includes(b.noteName)) distinctNotes.push(b.noteName);
      midiSum += b.exactMidi;
      pointsCount += b.pointsCount;
      if (b.midi < lowestM) {
        lowestM = b.midi;
        lowestN = b.noteName;
      }
      if (b.midi > highestM) {
        highestM = b.midi;
        highestN = b.noteName;
      }
      if (idx > 0) {
        const leap = Math.abs(b.midi - activeBars[idx - 1].midi);
        if (leap > maxLeap && leap < 24) maxLeap = leap;
      }
    });
  } else {
    lowestM = 60;
    highestM = 60;
    midiSum = 60;
    pointsCount = 10;
    distinctNotes.push('C4');
  }

  const avgMidi =
    activeBars.length > 0 ? Math.round((midiSum / activeBars.length) * 10) / 10 : 60;
  const avgPitchHz = Math.round(440 * Math.pow(2, (avgMidi - 69) / 12));
  const rangeSpan = Math.round(highestM - lowestM);

  let difficulty: 'Dễ' | 'Trung bình' | 'Thử thách' = 'Dễ';
  let difficultyScore = 3;
  if (rangeSpan > 12 || maxLeap > 7 || durationMs > 5500) {
    difficulty = 'Thử thách';
    difficultyScore = 8;
  } else if (rangeSpan > 7 || maxLeap > 4 || durationMs > 3200) {
    difficulty = 'Trung bình';
    difficultyScore = 5;
  }

  const phrase: IVocalPhrase = {
    id: `phrase-${phraseIndex}`,
    phraseIndex,
    startMs,
    endMs,
    durationMs,
    notes: distinctNotes.slice(0, 8),
    lowestNote: lowestN,
    highestNote: highestN,
    avgPitchHz,
    avgMidi,
    pitchJumpSemitones: Math.round(maxLeap),
    difficulty,
    difficultyScore,
    pointsCount,
    isInstrumentalOrVocalize: Boolean(isInstrumentalOrVocalize),
  };

  alignWordsToPhraseNoteBars(
    phrase,
    allNoteBars,
    lyricText,
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    wordTimestamps,
    preserveSyntheticText
  );

  return phrase;
}

/**
 * Sparse Anchor-Chain Piecewise Offset Estimator (Anti-Tempo-Drift & Anti-Domino Calibration):
 * Uses a non-greedy 1D Anchor-Chain Viterbi + MAD outlier filter to select consistent high-confidence
 * anchors across the song without allowing any single outlier onset to compound downstream.
 */
function estimatePiecewiseLineOffsets(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  baseOffsetMs: number,
  evaluatePhoneticMatch?: PhoneticEvaluationFn
): number[] {
  return findSparseAnchorChainOffsets({
    phrases,
    noteBars,
    lrcLines,
    baseOffsetMs,
    evaluatePhoneticMatch,
  });
}

/**
 * Pure Symmetric Subsequence Slot Planner (never mutates `noteBars` during structural evaluation):
 * Groups `bars` into natural singing clusters and aligns `lrcLines` bidirectionally using
 * `alignWindowSymmetricDP` (allowing both skipped LRC lines, skipped missing-lyric clusters,
 * and 2-to-1 splits/merges).
 */
function planStructuralSubsequenceSlots(
  cleanBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  evaluatePhoneticMatch?: PhoneticEvaluationFn
): IPhraseSlotDraft[] {
  if (cleanBars.length === 0 || lrcLines.length === 0) return [];

  const rawClusters = clusterNoteBarsBySilence(cleanBars, 380, 6200);
  const L = lrcLines.length;

  const filteredClusters =
    rawClusters.length > L
      ? rawClusters.filter((c) => c.length >= 2 || c[0].durationMs >= 200)
      : rawClusters;
  const avgWords =
    lrcLines.reduce((acc, l) => acc + Math.max(1, l.text.trim().split(/\s+/).filter(Boolean).length), 0) /
    Math.max(1, L);
  const clusters = expandClustersTowardCount(
    filteredClusters.length > 0 ? filteredClusters : rawClusters,
    L,
    avgWords
  );
  if (clusters.length === 0) return [];

  const symLines: ISymmetricLyricInput[] = lrcLines.map((l, idx) => ({
    text: l.text,
    timeMs: l.timeMs,
    postGapMs: idx + 1 < L ? Math.max(0, lrcLines[idx + 1].timeMs - l.timeMs) : 2500,
    wordTimestamps: l.wordTimestamps,
    originalLineIdx: idx,
  }));

  const symClusters: ISymmetricClusterInput[] = clusters.map((bars, idx) => ({
    bars,
    startMs: bars[0].startTimeMs,
    endMs: bars[bars.length - 1].endTimeMs,
    postGapMs:
      idx + 1 < clusters.length
        ? Math.max(0, clusters[idx + 1][0].startTimeMs - bars[bars.length - 1].endTimeMs)
        : 2000,
    originalClusterIdx: idx,
  }));

  const ops = alignWindowSymmetricDP({
    lines: symLines,
    clusters: symClusters,
    windowStartMs: cleanBars[0].startTimeMs,
    windowEndMs: cleanBars[cleanBars.length - 1].endTimeMs,
    useTimestampPrior: false,
    allowLineSkip: true,
    allowClusterSkip: true,
    allowMerge2Lines: true,
    allowMerge2Clusters: true,
    evaluatePhoneticMatch,
  });

  const slots: IPhraseSlotDraft[] = [];
  for (const op of ops) {
    if (op.kind === 'skip_line') continue;
    if (op.kind === 'skip_cluster') {
      const cStart = op.bars[0].startTimeMs;
      const cEnd = op.bars[op.bars.length - 1].endTimeMs;
      const cDur = cEnd - cStart;
      if (op.bars.length >= 2 || cDur >= 900) {
        slots.push({
          lrcIndices: [],
          bars: op.bars,
          isMissingGap: true,
          isRecoveredByDp: false,
        });
      }
      continue;
    }

    slots.push({
      lrcIndices: op.lineIndices,
      bars: op.bars,
      lyricText: op.text,
      shiftedTimeMs: op.timeMs,
      wordTimestamps: op.wordTimestamps,
      isMissingGap: false,
      isRecoveredByDp: true,
    });
  }

  return slots;
}

/**
 * Compute normalized DTW distance between two melodic interval sequences (pitch deltas in semitones).
 */
function melodicIntervalDtwDistance(seqA: number[], seqB: number[]): number {
  const n = seqA.length;
  const m = seqB.length;
  if (n === 0 || m === 0) return Infinity;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(seqA[i - 1] - seqB[j - 1]);
      dp[i][j] = cost + Math.min(dp[i - 1][j - 1], dp[i - 1][j] + 0.5, dp[i][j - 1] + 0.5);
    }
  }
  return dp[n][m] / Math.max(n, m);
}

/**
 * Auto-generate lyrics for `isMissingLyricGap` phrases:
 * 1. Melodic Interval Self-Similarity Clone (detects repeated Chorus / Verse melodies even if transposed)
 * 2. Acoustic Phonetic Syllable Synthesizer (synthesizes singable syllables 1-to-1 per NoteBar for unique bridges)
 */
function autoGenerateMissingLyrics(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = []
): void {
  const getIntervals = (bars: IVocalNoteBar[]) => {
    const ivs: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      ivs.push(bars[i].midi - bars[i - 1].midi);
    }
    return ivs;
  };

  const sourceCandidates = phrases
    .filter(
      (p) =>
        !p.isMissingLyricGap &&
        !p.isInstrumentalOrVocalize &&
        p.lyricText &&
        !p.lyricText.startsWith('Nguyên âm:')
    )
    .map((p) => {
      const bars = getPhraseNoteBarsStrict(p, noteBars);
      return {
        phrase: p,
        bars,
        intervals: getIntervals(bars),
      };
    })
    .filter((s) => s.bars.length >= 3 && s.intervals.length >= 2);

  // [steadyOral, steadyNasal, risingOral, fallingOral] — tone-concordant Vietnamese syllables per vowel family
  const SYLLABLE_MAP: Record<CoreVowelFamily, [string, string, string, string]> = {
    A: ['La', 'Na', 'Lá', 'Là'],
    E: ['Lê', 'Me', 'Lé', 'Lè'],
    I: ['Li', 'Di', 'Lí', 'Lì'],
    Ơ: ['Mơ', 'Lơ', 'Mớ', 'Mờ'],
    Ô: ['Đô', 'Lô', 'Đố', 'Đồ'],
    U: ['Ru', 'Nu', 'Rú', 'Rù'],
  };

  for (const p of phrases) {
    if (!p.isMissingLyricGap) continue;
    const gapBars = getPhraseNoteBarsStrict(p, noteBars);
    if (gapBars.length === 0) continue;
    const gapDur = Math.max(200, gapBars[gapBars.length - 1].endTimeMs - gapBars[0].startTimeMs);

    // 1. Try Melodic Interval Self-Similarity Clone (Chorus / Verse repetition)
    if (gapBars.length >= 3 && sourceCandidates.length > 0) {
      const gapIntervals = getIntervals(gapBars);
      let bestSource: (typeof sourceCandidates)[number] | null = null;
      let bestDist = Infinity;

      for (const src of sourceCandidates) {
        const maxLen = Math.max(src.bars.length, gapBars.length);
        const lenDiffAllowed = Math.max(2, Math.floor(maxLen * 0.35));
        if (Math.abs(src.bars.length - gapBars.length) > lenDiffAllowed) continue;
        const srcDur = Math.max(
          200,
          src.bars[src.bars.length - 1].endTimeMs - src.bars[0].startTimeMs
        );
        const durRelDiff = Math.abs(srcDur - gapDur) / Math.max(srcDur, gapDur);
        if (durRelDiff > 0.55) continue;

        const dist = melodicIntervalDtwDistance(gapIntervals, src.intervals);
        if (dist < bestDist) {
          bestDist = dist;
          bestSource = src;
        }
      }

      if (bestSource && bestDist <= 0.95 && bestSource.phrase.lyricText) {
        p.isMissingLyricGap = false;
        p.isAutoGeneratedMissing = true;
        p.autoGenSource = 'melodic_clone';
        p.alignmentIssue = null;
        p.alignmentIssueDetailVi = `Tự động khớp lời theo giai điệu lặp lại của Câu ${bestSource.phrase.phraseIndex}`;
        alignWordsToPhraseNoteBars(
          p,
          noteBars,
          bestSource.phrase.lyricText,
          rawMonoPcm,
          sampleRate,
          pitchTrack
        );
        continue;
      }
    }

    // 2. Fallback: Acoustic Phonetic + Tone-Concordant Syllable Synthesis 1-to-1 per NoteBar
    const synthTokens = gapBars.map((bar, bIdx) => {
      const prevBar = bIdx > 0 ? gapBars[bIdx - 1] : null;
      const deep = analyzeDeepNoteBarVowelAndTrajectory({
        rawMonoPcm: rawMonoPcm || null,
        sampleRate,
        bar,
        prevBar,
        pitchTrack,
      });
      const quad = SYLLABLE_MAP[deep.vowelFamily] || ['La', 'Na', 'Lá', 'Là'];
      const hasNasal =
        rawMonoPcm &&
        computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, bar.startTimeMs + 25) < 2.0;

      let chosenSyl = hasNasal ? quad[1] : quad[0];
      if (!hasNasal && prevBar) {
        const step = bar.midi - prevBar.midi;
        if (step >= 2) chosenSyl = quad[2]; // Rising pitch step -> Sắc tone
        else if (step <= -2) chosenSyl = quad[3]; // Falling pitch drop -> Huyền tone
      }
      return bIdx === 0 ? chosenSyl : chosenSyl.toLowerCase();
    });

    const synthText = synthTokens.join(' ');
    p.isAutoGeneratedMissing = true;
    p.autoGenSource = 'phonetic_synth';
    p.alignmentIssueDetailVi = `Âm tiết tổng hợp tự động theo Formant (${gapBars.length} nốt) — bạn có thể bấm AI Bóc Câu để đổi sang lời thật`;
    alignWordsToPhraseNoteBars(
      p,
      noteBars,
      synthText,
      rawMonoPcm,
      sampleRate,
      pitchTrack,
      undefined,
      true
    );
  }
}

/**
 * Helper: Trim stray edge tail or post-sentence pickup bars from a candidate NoteBar cluster
 * so phrase timing wraps strictly around the sung words.
 */
function trimSlotClusterBars(bars: IVocalNoteBar[], lyricText?: string): IVocalNoteBar[] {
  if (bars.length < 2 || !lyricText) return bars;
  let activeBars = bars;
  const wordCount = lyricText.trim().split(/\s+/).filter(Boolean).length;

  if (
    activeBars.length > wordCount &&
    activeBars[1].startTimeMs - activeBars[0].endTimeMs >= 500
  ) {
    activeBars = activeBars.slice(1);
  }

  const maxSungSpanMs = Math.max(2600, wordCount * 640 + 1600);
  const phraseOriginMs = activeBars[0]?.startTimeMs ?? 0;
  for (let i = 0; i < activeBars.length - 1; i++) {
    const gap = activeBars[i + 1].startTimeMs - activeBars[i].endTimeMs;
    const elapsedMs = activeBars[i + 1].startTimeMs - phraseOriginMs;
    const enoughForAllWords = i + 1 >= wordCount && gap >= 450;
    const enoughForMostWords =
      i + 1 >= Math.max(2, Math.floor(wordCount * 0.65)) && gap >= 950;
    const clearInterPhrasePause = i + 1 >= 2 && gap >= 1350;
    const beyondReasonableSungWindow = elapsedMs > maxSungSpanMs && gap >= 260;

    if (
      enoughForAllWords ||
      enoughForMostWords ||
      clearInterPhrasePause ||
      beyondReasonableSungWindow
    ) {
      activeBars = activeBars.slice(0, i + 1);
      break;
    }
  }
  return activeBars;
}

/**
 * Evaluate overall slot plan quality against clean unsplit original NoteBars.
 */
function evaluateSlotPlanQuality(
  slots: IPhraseSlotDraft[],
  firstBarMs: number,
  lastBarMs: number,
  activeOnly: boolean,
  evaluatePhoneticMatch?: PhoneticEvaluationFn
) {
  let empty = 0;
  let misaligned = 0;
  let matched = 0;
  let coveredBars = 0;
  let phoneticSum = 0;

  for (const s of slots) {
    if (s.isMissingGap) continue;
    const bStart = s.bars[0]?.startTimeMs ?? s.shiftedTimeMs ?? 0;
    const bEnd = s.bars[s.bars.length - 1]?.endTimeMs ?? bStart;
    if (activeOnly && (bEnd < firstBarMs - 1500 || bStart > lastBarMs + 1500)) {
      continue;
    }
    const tokens = (s.lyricText || '').trim().split(/\s+/).filter(Boolean);
    const wCnt = Math.max(1, tokens.length);
    const bCnt = s.bars.length;
    if (bCnt === 0) {
      empty++;
    } else {
      matched++;
      const phonetic = evaluatePhoneticMatch
        ? evaluatePhoneticMatch(tokens, [
            {
              bars: s.bars,
              startMs: s.bars[0].startTimeMs,
              endMs: s.bars[s.bars.length - 1].endTimeMs,
            },
          ])
        : null;
      const effectiveUnits =
        phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
          ? Math.max(bCnt, phonetic.acousticSyllableCount)
          : bCnt;
      coveredBars += effectiveUnits;
      if (phonetic?.hasUsableAudio) {
        phoneticSum -= phonetic.phoneticBonusCost;
      }
      const hasDensityMismatch =
        (wCnt >= 4 && effectiveUnits === 1) ||
        (wCnt >= 3 && effectiveUnits / wCnt < 0.35) ||
        Boolean(phonetic?.hasUsableAudio && phonetic.phoneticBonusCost >= 1.45);
      if (hasDensityMismatch) {
        misaligned++;
      }
    }
  }

  const score = matched * 3 - misaligned * 2 - empty * 3 + coveredBars * 0.5 + phoneticSum;
  return { empty, misaligned, matched, coveredBars, score };
}

/**
 * Align parsed LRC lines onto IVocalPhrase[] using:
 * 1. Global Audio-to-LRC Time Offset Auto-Calibration + Sparse Anchor-Chain Tempo Drift Correction
 * 2. Pure unsplit-bar evaluation -> Anchor-Constrained Local Island Repair (`repairDamagedPhraseWindowsLocally`)
 *    so any single localized cascade shift is repaired without moving verified neighbor lines
 * 3. Bidirectional Symmetric Subsequence Recovery (`planStructuralSubsequenceSlots`) when >= 35% lines drift
 * 4. Single-pass NoteBar Commit + Auto-Generation of missing lyrics (Melodic Clone / Phonetic Synthesis)
 */
export function alignLrcLinesToPhrases(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = [],
  audioDurationMs?: number,
  precomputedProfiles?: Map<string, IClusterPhoneticProfile>
): void {
  if (phrases.length === 0 || lrcLines.length === 0) return;

  // Snapshot original unsplit NoteBars so temporary trial alignments never corrupt NoteBar density counts
  const cleanOriginalBars = noteBars.map((b) => ({ ...b }));
  const evaluatePhoneticMatch = createPhoneticEvaluatorForTrack(
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    precomputedProfiles
  );

  const optimalOffsetMs = estimateOptimalLrcOffsetMs(
    phrases,
    cleanOriginalBars,
    lrcLines,
    audioDurationMs
  );
  const lineOffsets = estimatePiecewiseLineOffsets(
    phrases,
    cleanOriginalBars,
    lrcLines,
    optimalOffsetMs,
    evaluatePhoneticMatch
  );

  const shiftedLines = lrcLines.map((l, idx) => {
    const off = lineOffsets[idx] ?? optimalOffsetMs;
    return {
      timeMs: Math.max(0, l.timeMs + off),
      text: l.text,
      wordTimestamps: l.wordTimestamps?.map((wt) => ({
        timeMs: Math.max(0, wt.timeMs + off),
        text: wt.text,
      })),
    };
  });

  // Compute breath-snapped boundary timestamps B[0..L] between consecutive LRC lines
  const L = shiftedLines.length;
  const boundaries: number[] = new Array(L + 1);
  boundaries[0] = Math.max(0, shiftedLines[0].timeMs - 300);

  for (let i = 1; i < L; i++) {
    const nominalMs = shiftedLines[i].timeMs;
    const prevMid = Math.round((shiftedLines[i - 1].timeMs + nominalMs) / 2);
    const nextMid =
      i + 1 < L ? Math.round((nominalMs + shiftedLines[i + 1].timeMs) / 2) : nominalMs + 850;
    const minWindow = Math.max(
      shiftedLines[i - 1].timeMs + 250,
      Math.min(prevMid, nominalMs - 850)
    );
    const maxWindow =
      i + 1 < L
        ? Math.min(shiftedLines[i + 1].timeMs - 250, Math.max(nextMid, nominalMs + 850))
        : nominalMs + 850;

    let bestBoundaryMs = nominalMs;
    let bestGapScore = -Infinity;

    for (let k = 0; k < cleanOriginalBars.length - 1; k++) {
      const gapStart = cleanOriginalBars[k].endTimeMs;
      const gapEnd = cleanOriginalBars[k + 1].startTimeMs;
      const gapDur = gapEnd - gapStart;
      // Ignore tiny intra-word/syllable micro-gaps (< 140ms) so phrase boundaries never slice clusters in half!
      if (gapDur < 140) continue;

      const gapMid = Math.round((gapStart + gapEnd) / 2);
      // Anchor right before the next phrase onset (`gapEnd - 25ms`) when a long breath precedes it
      const onsetEdgeMs = Math.max(gapStart + 15, gapEnd - 25);
      const candidates = gapDur >= 320 ? [onsetEdgeMs, gapMid] : [gapMid, onsetEdgeMs];

      for (const candMs of candidates) {
        if (candMs < minWindow || candMs > maxWindow) continue;
        const distPenalty = Math.abs(candMs - nominalMs) * 0.25;
        const gapScore = gapDur - distPenalty;
        if (gapScore > bestGapScore) {
          bestGapScore = gapScore;
          bestBoundaryMs = candMs;
        }
      }
    }

    boundaries[i] = bestBoundaryMs;
  }

  const lastBarEnd =
    cleanOriginalBars.length > 0
      ? cleanOriginalBars[cleanOriginalBars.length - 1].endTimeMs + 500
      : shiftedLines[L - 1].timeMs + 5000;
  boundaries[L] = Math.max(lastBarEnd, shiftedLines[L - 1].timeMs + 4000);

  // Strict Healthy Fast-Path when phrase count === LRC lines AND zero defects exist
  if (phrases.length === L) {
    const fastPathLines = shiftedLines.map((sl, i) => {
      const bStart = boundaries[i];
      const tokens = sl.text.trim().split(/\s+/).filter(Boolean);
      const wordCount = Math.max(1, tokens.length);
      const maxSungWindowEnd = sl.timeMs + Math.max(3200, wordCount * 680 + 1800);
      const bEnd = Math.min(boundaries[i + 1], maxSungWindowEnd);
      const lineBars = cleanOriginalBars.filter((b) => {
        const mid = (b.startTimeMs + b.endTimeMs) / 2;
        return mid >= bStart && mid < bEnd;
      });
      const phonetic =
        evaluatePhoneticMatch && lineBars.length > 0
          ? evaluatePhoneticMatch(tokens, [
              {
                bars: lineBars,
                startMs: lineBars[0].startTimeMs,
                endMs: lineBars[lineBars.length - 1].endTimeMs,
              },
            ])
          : null;
      const effectiveUnits =
        phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
          ? Math.max(lineBars.length, phonetic.acousticSyllableCount)
          : lineBars.length;
      const ratio = effectiveUnits / wordCount;
      const isToneInv =
        wordCount >= 5 &&
        lineBars.length >= 3 &&
        computePhraseToneMelodicHarmony(
          tokens,
          lineBars.slice(0, wordCount).map((b) => b.midi)
        ).overallScorePercent < 42;
      const isPhoneticMismatch = Boolean(
        phonetic?.hasUsableAudio && phonetic.phoneticBonusCost >= 1.35
      );
      const isBad =
        cleanOriginalBars.length > 0 &&
        (lineBars.length === 0 ||
          (wordCount >= 4 && effectiveUnits === 1) ||
          (wordCount >= 3 && ratio < 0.35) ||
          isToneInv ||
          isPhoneticMismatch);
      return { sl, lineBars, isBad };
    });

    const badCount = fastPathLines.filter((x) => x.isBad).length;
    const fastCoveredIds = new Set<string>();
    fastPathLines.forEach((x) => x.lineBars.forEach((b) => fastCoveredIds.add(b.id)));
    const uncoveredCount = cleanOriginalBars.filter((b) => !fastCoveredIds.has(b.id)).length;

    if (cleanOriginalBars.length === 0 || (badCount === 0 && uncoveredCount === 0)) {
      phrases.forEach((p, i) => {
        const { sl, lineBars } = fastPathLines[i];
        if (lineBars.length > 0) {
          p.startMs = lineBars[0].startTimeMs;
          p.endMs = lineBars[lineBars.length - 1].endTimeMs;
          p.durationMs = Math.max(200, p.endMs - p.startMs);
        }
        p.isInstrumentalOrVocalize = false;
        alignWordsToPhraseNoteBars(
          p,
          noteBars,
          sl.text,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
          sl.wordTimestamps
        );
      });
      return;
    }
  }

  // Build pure Phase 1 slots on cleanOriginalBars (without mutating live noteBars yet)
  const initialSlots: IPhraseSlotDraft[] = [];
  const maxAudioMs = Math.max(
    audioDurationMs ? audioDurationMs + 4000 : 0,
    phrases.length > 0 ? phrases[phrases.length - 1].endMs + 8000 : boundaries[L]
  );

  for (let i = 0; i < L; i++) {
    const bStart = boundaries[i];
    const wordCount = Math.max(
      1,
      shiftedLines[i].text.trim().split(/\s+/).filter(Boolean).length
    );
    const maxSungWindowEnd =
      shiftedLines[i].timeMs + Math.max(3200, wordCount * 680 + 1800);
    const bEnd = Math.min(boundaries[i + 1], maxSungWindowEnd);

    const rawLineBars = cleanOriginalBars.filter((b) => {
      const mid = (b.startTimeMs + b.endTimeMs) / 2;
      return mid >= bStart && mid < bEnd;
    });

    if (rawLineBars.length === 0 && bStart > maxAudioMs) {
      continue;
    }

    const trimmedBars = trimSlotClusterBars(rawLineBars, shiftedLines[i].text);
    initialSlots.push({
      lrcIndices: [i],
      bars: trimmedBars,
      lyricText: shiftedLines[i].text,
      shiftedTimeMs: shiftedLines[i].timeMs,
      wordTimestamps: shiftedLines[i].wordTimestamps,
      isMissingGap: false,
      isRecoveredByDp: false,
    });
  }

  // Gap-Preserving Hybrid Slot Detection: collect substantial singing segments uncovered by LRC
  if (initialSlots.length > 0 && cleanOriginalBars.length > 0) {
    const coveredBarIds = new Set<string>();
    for (const s of initialSlots) {
      s.bars.forEach((b) => coveredBarIds.add(b.id));
    }
    const orphanBars = cleanOriginalBars.filter((b) => !coveredBarIds.has(b.id));
    if (orphanBars.length > 0) {
      const firstMatchedStart =
        initialSlots.find((s) => s.bars.length > 0)?.bars[0]?.startTimeMs ??
        initialSlots[0].shiftedTimeMs ??
        0;
      const orphanClusters = clusterNoteBarsBySilence(orphanBars, 450, 5500);
      for (const cluster of orphanClusters) {
        const cStart = cluster[0].startTimeMs;
        const cEnd = cluster[cluster.length - 1].endTimeMs;
        const cDur = cEnd - cStart;
        const isBeforeFirstLrc = cEnd < firstMatchedStart - 150;
        if (isBeforeFirstLrc) {
          const distinctMidis = new Set(cluster.map((b) => b.midi));
          if (cluster.length < 2 || distinctMidis.size < 2) continue;
        }
        const isGenuineSinging =
          (cluster.length >= 2 && cDur >= 650) || (cluster.length === 1 && cDur >= 900);
        if (!isGenuineSinging) continue;

        initialSlots.push({
          lrcIndices: [],
          bars: cluster,
          isMissingGap: true,
          isRecoveredByDp: false,
        });
      }

      initialSlots.sort((a, b) => {
        const ta = a.bars[0]?.startTimeMs ?? a.shiftedTimeMs ?? 0;
        const tb = b.bars[0]?.startTimeMs ?? b.shiftedTimeMs ?? 0;
        return ta - tb;
      });
    }
  }

  // Phase 2: Anchor-Constrained Local Island Repair (runs even when badRatio < 35%!)
  // Isolates localized cascade shifts / missing gaps between verified Anchor Islands and repairs them locally.
  let chosenSlots = repairDamagedPhraseWindowsLocally({
    initialSlots,
    shiftedLines,
    cleanOriginalBars,
    evaluatePhoneticMatch,
  });

  // Phase 3: Global Distrust-First Structural Check when >= 35% of active lines remain shifted/missing
  if (lrcLines.length >= 3 && cleanOriginalBars.length >= 3) {
    const firstBarMs = cleanOriginalBars[0].startTimeMs;
    const lastBarMs = cleanOriginalBars[cleanOriginalBars.length - 1].endTimeMs;
    const lrcSlotsCount = chosenSlots.filter((s) => !s.isMissingGap).length;
    const missingGapsCount = chosenSlots.filter((s) => s.isMissingGap).length;
    const activeLrcSlots = chosenSlots.filter((s) => {
      if (s.isMissingGap) return false;
      const bStart = s.bars[0]?.startTimeMs ?? s.shiftedTimeMs ?? 0;
      const bEnd = s.bars[s.bars.length - 1]?.endTimeMs ?? bStart;
      return bEnd >= firstBarMs - 1500 && bStart <= lastBarMs + 1500;
    });

    const origEval = evaluateSlotPlanQuality(
      chosenSlots,
      firstBarMs,
      lastBarMs,
      true,
      evaluatePhoneticMatch
    );
    const droppedLinesCount = Math.max(0, lrcLines.length - lrcSlotsCount);
    const relevantDropped = Math.min(droppedLinesCount, missingGapsCount);
    const activeDenominator = Math.max(1, activeLrcSlots.length + relevantDropped);
    const effectiveBadRatio =
      (origEval.empty + origEval.misaligned + relevantDropped) / activeDenominator;

    if (effectiveBadRatio >= 0.35 && activeLrcSlots.length + missingGapsCount >= 2) {
      const globalSlots = planStructuralSubsequenceSlots(
        cleanOriginalBars,
        lrcLines,
        evaluatePhoneticMatch
      );
      if (globalSlots.length > 0) {
        const subseqEval = evaluateSlotPlanQuality(
          globalSlots,
          firstBarMs,
          lastBarMs,
          false,
          evaluatePhoneticMatch
        );
        const strictlyBetter =
          subseqEval.matched > origEval.matched ||
          (subseqEval.matched === origEval.matched &&
            (subseqEval.misaligned < origEval.misaligned ||
              subseqEval.coveredBars > origEval.coveredBars));
        if (strictlyBetter && subseqEval.score > origEval.score) {
          chosenSlots = globalSlots;
        }
      }
    }
  }

  // Phase 4: Single-Pass Commit onto real NoteBars + Word Forced Alignment + Missing Auto-Gen
  const rebuiltPhrases: IVocalPhrase[] = [];
  chosenSlots.forEach((slot, idx) => {
    // Map slot's original NoteBar IDs onto the live `noteBars` array
    const liveBars =
      slot.bars.length > 0
        ? slot.bars
            .map((ob) => noteBars.find((nb) => nb.id === ob.id))
            .filter((b): b is IVocalNoteBar => Boolean(b))
        : [];
    const fallbackStart =
      liveBars[0]?.startTimeMs ?? slot.shiftedTimeMs ?? 0;
    const fallbackEnd =
      liveBars[liveBars.length - 1]?.endTimeMs ??
      Math.min(
        fallbackStart + 3800,
        (slot.shiftedTimeMs ?? fallbackStart) + 3800
      );

    const built = buildPhraseFromBarsAndLyric({
      phraseIndex: idx + 1,
      bars: liveBars,
      fallbackStartMs: fallbackStart,
      fallbackEndMs: fallbackEnd,
      lyricText: slot.isMissingGap ? undefined : slot.lyricText,
      isInstrumentalOrVocalize: false,
      allNoteBars: noteBars,
      rawMonoPcm,
      sampleRate,
      pitchTrack,
      wordTimestamps: slot.wordTimestamps,
    });

    if (slot.isMissingGap) {
      built.isMissingLyricGap = true;
      built.alignmentIssue = 'missing_lyric';
      built.alignmentIssueDetailVi = `Phát hiện đoạn hát (${liveBars.length} nốt) chưa có lời LRC khớp tới`;
    } else if (slot.isRecoveredByDp) {
      built.isRecoveredByDp = true;
    }

    rebuiltPhrases.push(built);
  });

  if (rebuiltPhrases.some((p) => p.isMissingLyricGap)) {
    autoGenerateMissingLyrics(rebuiltPhrases, noteBars, rawMonoPcm, sampleRate, pitchTrack);
  }

  if (rebuiltPhrases.length > 0) {
    phrases.splice(0, phrases.length, ...rebuiltPhrases);
  }
}

/**
 * Audit the health of aligned lyrics against actual audio NoteBars & Vietnamese prosody.
 * Flags per-phrase issues (`missing_lyric`, `empty_audio`, `density_overflow`, `density_underflow`, `tone_inverted`)
 * and returns a global `IAlignmentHealthReport`.
 */
export function auditLyricAlignmentHealth(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[]
): IAlignmentHealthReport {
  if (phrases.length === 0) {
    return {
      status: 'no_lyrics',
      healthScorePct: 0,
      coverageRatio: 0,
      emptyAudioRatio: 0,
      orphanVocalMs: 0,
      missingGapRanges: [],
      flaggedPhraseIndices: [],
      summaryVi: 'Chưa có câu hát nào được phân tích.',
    };
  }

  let hasAnyRealLyric = false;
  let emptyAudioCount = 0;
  let healthyCount = 0;
  let orphanVocalMs = 0;
  let matchedLrcCount = 0;
  let recoveredDpCount = 0;
  let autoGenCloneCount = 0;
  let autoGenSynthCount = 0;
  const missingGapRanges: Array<{ startMs: number; endMs: number; barCount: number }> = [];
  const flaggedPhraseIndices: number[] = [];

  for (const p of phrases) {
    const pBars = getPhraseNoteBarsStrict(p, noteBars);
    const wordCount = p.words?.length ?? (p.lyricText ? p.lyricText.trim().split(/\s+/).filter(Boolean).length : 0);
    const isFallbackOnly =
      !p.lyricText ||
      p.lyricText.startsWith('Nguyên âm:') ||
      p.lyricText.startsWith('🎵') ||
      Boolean(p.isMissingLyricGap);

    if (!isFallbackOnly) {
      hasAnyRealLyric = true;
    }

    if (p.isAutoGeneratedMissing) {
      if (p.autoGenSource === 'melodic_clone') autoGenCloneCount++;
      else if (p.autoGenSource === 'phonetic_synth') autoGenSynthCount++;
    } else if (p.isRecoveredByDp && !p.isMissingLyricGap) {
      recoveredDpCount++;
    } else if (!p.isMissingLyricGap && !p.isInstrumentalOrVocalize && pBars.length > 0 && !isFallbackOnly) {
      matchedLrcCount++;
    }

    if (p.isMissingLyricGap) {
      p.alignmentIssue = 'missing_lyric';
      if (!p.isAutoGeneratedMissing || !p.alignmentIssueDetailVi) {
        p.alignmentIssueDetailVi = `Đoạn hát (${pBars.length} nốt) chưa có lời LRC khớp tới`;
      }
      orphanVocalMs += p.durationMs;
      missingGapRanges.push({ startMs: p.startMs, endMs: p.endMs, barCount: pBars.length });
      flaggedPhraseIndices.push(p.phraseIndex);
      continue;
    }

    if (!p.isInstrumentalOrVocalize && pBars.length === 0) {
      emptyAudioCount++;
      p.alignmentIssue = 'empty_audio';
      p.alignmentIssueDetailVi = 'Câu LRC rơi vào khoảng lặng hoặc đoạn nhạc không có cao độ giọng hát';
      flaggedPhraseIndices.push(p.phraseIndex);
    } else if (!p.isInstrumentalOrVocalize && wordCount >= 6 && pBars.length > 0 && wordCount / pBars.length >= 2.4) {
      p.alignmentIssue = 'density_overflow';
      p.alignmentIssueDetailVi = `Quá nhiều chữ (${wordCount} chữ) dồn vào ít nốt (${pBars.length} nốt) — có thể lệch ranh giới câu`;
      flaggedPhraseIndices.push(p.phraseIndex);
    } else if (!p.isInstrumentalOrVocalize && pBars.length >= 8 && wordCount > 0 && pBars.length / wordCount >= 3.2) {
      p.alignmentIssue = 'density_underflow';
      p.alignmentIssueDetailVi = `Quá nhiều nốt (${pBars.length} nốt) cho ít chữ (${wordCount} chữ) — có thể ăn lấn sang câu sau`;
      flaggedPhraseIndices.push(p.phraseIndex);
    } else if (typeof p.toneHarmonyScore === 'number' && wordCount >= 5 && p.toneHarmonyScore < 42) {
      p.alignmentIssue = 'tone_inverted';
      p.alignmentIssueDetailVi = `Thanh điệu tiếng Việt nghịch giai điệu (${p.toneHarmonyScore}%) — nghi ngờ lệch nhịp`;
      flaggedPhraseIndices.push(p.phraseIndex);
    } else {
      p.alignmentIssue = null;
      if (!p.isAutoGeneratedMissing) {
        p.alignmentIssueDetailVi = undefined;
      }
      if (!isFallbackOnly) healthyCount++;
    }
  }

  const engineParts: string[] = [];
  if (matchedLrcCount > 0) engineParts.push(`${matchedLrcCount} câu khớp LRC`);
  if (recoveredDpCount > 0) engineParts.push(`${recoveredDpCount} câu khôi phục DP`);
  if (autoGenCloneCount > 0) engineParts.push(`${autoGenCloneCount} đoạn tự gen lặp điệp khúc`);
  if (autoGenSynthCount > 0) engineParts.push(`${autoGenSynthCount} đoạn tự tổng hợp Formant`);
  const engineSummaryVi =
    engineParts.length > 0
      ? engineParts.join(' · ')
      : 'Phân tích âm tiết Formant tự động theo cao độ';

  if (!hasAnyRealLyric) {
    return {
      status: 'no_lyrics',
      healthScorePct: 35,
      coverageRatio: 0,
      emptyAudioRatio: 0,
      orphanVocalMs: phrases.reduce((s, p) => s + p.durationMs, 0),
      missingGapRanges: [],
      flaggedPhraseIndices,
      summaryVi: 'Chưa có lời bài hát (đang dùng Nguyên âm Formant F1/F2 tự động).',
      matchedLrcCount,
      recoveredDpCount,
      autoGenCloneCount,
      autoGenSynthCount,
      engineSummaryVi,
    };
  }

  const totalNonGap = Math.max(1, phrases.length - missingGapRanges.length);
  const emptyAudioRatio = Math.round((emptyAudioCount / totalNonGap) * 100) / 100;
  const coverageRatio = Math.round((healthyCount / phrases.length) * 100) / 100;
  const healthScorePct = Math.max(
    0,
    Math.min(100, Math.round((healthyCount / phrases.length) * 100 - emptyAudioRatio * 25))
  );

  let status: IAlignmentHealthReport['status'] = 'healthy';
  let summaryVi = `Độ khớp LRC tốt (${healthScorePct}% · ${healthyCount}/${phrases.length} câu chuẩn).`;

  if (emptyAudioRatio >= 0.5 || coverageRatio < 0.38) {
    status = 'mismatch_suspected';
    summaryVi = `Nghi ngờ LRC sai bài hoặc lệch bản phối (${Math.round(emptyAudioRatio * 100)}% câu LRC rơi vào khoảng lặng, độ phủ ${Math.round(coverageRatio * 100)}%).`;
  } else if (missingGapRanges.length > 0 || coverageRatio < 0.82) {
    status = 'partial_gaps';
    summaryVi = `LRC khớp ${Math.round(coverageRatio * 100)}% bài, phát hiện ${missingGapRanges.length} đoạn hát thiếu lời (đã tự bù ${autoGenSynthCount + autoGenCloneCount} đoạn).`;
  }

  return {
    status,
    healthScorePct,
    coverageRatio,
    emptyAudioRatio,
    orphanVocalMs,
    missingGapRanges,
    flaggedPhraseIndices,
    summaryVi,
    matchedLrcCount,
    recoveredDpCount,
    autoGenCloneCount,
    autoGenSynthCount,
    engineSummaryVi,
  };
}

/**
 * Align plain multi-line text onto IVocalPhrase[] using Anchor-Aware Bidirectional DP
 * (eliminating greedy phrase-merge cascade shifts when an intro hum, adlib, or missing bridge exists).
 */
export function alignPlainTextToPhrases(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  plainText: string,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = [],
  precomputedProfiles?: Map<string, IClusterPhoneticProfile>
): void {
  const cleanLines = plainText
    .replace(/<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g, ' ')
    .replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, ' ')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !/^\[(?:verse|chorus|pre-?chorus|bridge|intro|outro|điệp khúc|phiên khúc|rap|ti|ar|al|by|offset).*?\]$/i.test(l)
    );

  if (cleanLines.length === 0 || phrases.length === 0) return;

  const cleanOriginalBars = noteBars.map((b) => ({ ...b }));
  const evaluatePhoneticMatch = createPhoneticEvaluatorForTrack(
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    precomputedProfiles
  );
  const L = cleanLines.length;
  const P = phrases.length;

  const buildPhraseClusterInput = (p: IVocalPhrase, idx: number): ISymmetricClusterInput => {
    const pBars = getPhraseNoteBarsStrict(p, cleanOriginalBars);
    const bars: IVocalNoteBar[] =
      pBars.length > 0
        ? pBars
        : [
            {
              id: `virt-bar-${idx}`,
              startTimeMs: p.startMs,
              endTimeMs: p.endMs,
              durationMs: p.durationMs,
              midi: Math.round(p.avgMidi || 60),
              exactMidi: p.avgMidi || 60,
              noteName: p.lowestNote || 'C4',
              solfegeName: 'Đô 4',
              avgCentsDiff: 0,
              pointsCount: p.pointsCount || 10,
            },
          ];
    let acousticSyllableCount = bars.length;
    if (evaluatePhoneticMatch && pBars.length > 0) {
      const ph = evaluatePhoneticMatch([], [
        { bars, startMs: p.startMs, endMs: p.endMs },
      ]);
      if (ph.hasUsableAudio && ph.acousticSyllableCount) {
        acousticSyllableCount = Math.max(bars.length, ph.acousticSyllableCount);
      }
    }
    return {
      bars,
      startMs: p.startMs,
      endMs: p.endMs,
      postGapMs: idx + 1 < P ? Math.max(0, phrases[idx + 1].startMs - p.endMs) : 2000,
      originalClusterIdx: idx,
      acousticSyllableCount,
    };
  };

  // Case A: Equal count -> preserve fast 1-to-1 when densities & phonetics align without shifts
  if (L === P) {
    let severeClashes = 0;
    phrases.forEach((p, idx) => {
      const pBars = getPhraseNoteBarsStrict(p, cleanOriginalBars);
      const tokens = cleanLines[idx].split(/\s+/).filter(Boolean);
      const wCnt = Math.max(1, tokens.length);
      const phonetic =
        evaluatePhoneticMatch && pBars.length > 0
          ? evaluatePhoneticMatch(tokens, [{ bars: pBars, startMs: p.startMs, endMs: p.endMs }])
          : null;
      const effectiveUnits =
        phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
          ? Math.max(pBars.length, phonetic.acousticSyllableCount)
          : pBars.length;
      if (
        cleanOriginalBars.length > 0 &&
        (pBars.length === 0 ||
          (wCnt >= 4 && effectiveUnits <= 1) ||
          (wCnt >= 3 && effectiveUnits / wCnt < 0.35) ||
          (pBars.length >= 6 && pBars.length / wCnt >= 2.8) ||
          Boolean(phonetic?.hasUsableAudio && phonetic.phoneticBonusCost >= 1.35))
      ) {
        severeClashes++;
      }
    });

    if (severeClashes < 2) {
      phrases.forEach((p, idx) => {
        p.isInstrumentalOrVocalize = false;
        p.isMissingLyricGap = false;
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
  }

  const clusterInputs: ISymmetricClusterInput[] = phrases.map(buildPhraseClusterInput);
  const lineInputs: ISymmetricLyricInput[] = cleanLines.map((text, idx) => ({
    text,
    postGapMs: 2000,
    originalLineIdx: idx,
  }));

  const commitSymmetricOps = (ops: ReturnType<typeof alignWindowSymmetricDP>) => {
    const rebuilt: IVocalPhrase[] = [];
    let nextIdx = 1;
    for (const op of ops) {
      if (op.kind === 'skip_line') continue;
      const firstOrigPhrase = phrases[op.clusterIndices[0]];
      const lastOrigPhrase = phrases[op.clusterIndices[op.clusterIndices.length - 1]];
      const liveBars = op.bars
        .map((b) => noteBars.find((nb) => nb.id === b.id))
        .filter((b): b is IVocalNoteBar => Boolean(b));

      const phrase = buildPhraseFromBarsAndLyric({
        phraseIndex: nextIdx++,
        bars: liveBars,
        fallbackStartMs: firstOrigPhrase.startMs,
        fallbackEndMs: lastOrigPhrase.endMs,
        lyricText: op.kind === 'skip_cluster' ? undefined : op.text,
        isInstrumentalOrVocalize: false,
        allNoteBars: noteBars,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
      });

      if (op.kind === 'skip_cluster') {
        phrase.isMissingLyricGap = true;
        phrase.alignmentIssue = 'missing_lyric';
      } else if (op.kind === 'merge_2_clusters' || op.kind === 'merge_2_lines') {
        phrase.isRecoveredByDp = true;
      }
      rebuilt.push(phrase);
    }

    if (rebuilt.length > 0) {
      phrases.splice(0, phrases.length, ...rebuilt);
    }
    if (phrases.some((p) => p.isMissingLyricGap)) {
      autoGenerateMissingLyrics(phrases, noteBars, rawMonoPcm, sampleRate, pitchTrack);
    }
  };

  // Case B: Lyric has more lines than audio phrases (L > P)
  // Compares Phonetic-Weighted Packing (when fragmented short lines share long sustained phrases)
  // against Symmetric Sequence Alignment DP (`SKIP_LINE` + `MERGE_2_LINES` when lines were missed!).
  if (L > P && P >= 1) {
    const lineWordCounts = cleanLines.map((l) => Math.max(1, l.split(/\s+/).filter(Boolean).length));
    const phraseUnits = clusterInputs.map((c) => Math.max(1, c.acousticSyllableCount ?? c.bars.length));

    const dp: number[][] = Array.from({ length: P }, () => new Array(L).fill(Infinity));
    const prevSplit: number[][] = Array.from({ length: P }, () => new Array(L).fill(0));

    const groupCost = (pIdx: number, lStart: number, lEnd: number) => {
      let wordsSum = 0;
      const mergedTokens: string[] = [];
      for (let k = lStart; k <= lEnd; k++) {
        wordsSum += lineWordCounts[k];
        mergedTokens.push(...cleanLines[k].split(/\s+/).filter(Boolean));
      }
      const c = clusterInputs[pIdx];
      const barCnt = phraseUnits[pIdx];
      const densityDiff = Math.abs(wordsSum - barCnt);
      const durExpectedMs = Math.max(420, wordsSum * 265);
      const durDiff = Math.abs((c.endMs - c.startMs) - durExpectedMs) / Math.max(500, durExpectedMs);
      const durPen = Math.min(4.0, durDiff * 1.45);
      const phonetic = evaluatePhoneticMatch
        ? evaluatePhoneticMatch(mergedTokens, [
            { bars: c.bars, startMs: c.startMs, endMs: c.endMs },
          ])
        : null;
      const phoneticCost = phonetic?.hasUsableAudio ? phonetic.phoneticBonusCost : 0;
      const multiLinePenalty = (lEnd - lStart) * 2.2;
      return densityDiff + durPen + phoneticCost + multiLinePenalty;
    };

    for (let l = 0; l <= L - P; l++) {
      dp[0][l] = groupCost(0, 0, l);
      prevSplit[0][l] = 0;
    }

    for (let p = 1; p < P; p++) {
      const minEnd = p;
      const maxEnd = L - 1 - (P - 1 - p);
      for (let l = minEnd; l <= maxEnd; l++) {
        for (let prevL = p - 1; prevL < l; prevL++) {
          if (dp[p - 1][prevL] === Infinity) continue;
          const cand = dp[p - 1][prevL] + groupCost(p, prevL + 1, l);
          if (cand < dp[p][l]) {
            dp[p][l] = cand;
            prevSplit[p][l] = prevL + 1;
          }
        }
      }
    }

    const assignedRanges: Array<{ start: number; end: number }> = new Array(P);
    let currEnd = L - 1;
    for (let p = P - 1; p >= 0; p--) {
      const start = prevSplit[p][currEnd];
      assignedRanges[p] = { start, end: currEnd };
      currEnd = start - 1;
    }

    // When P >= 3 and L isn't massively fragmented, test Symmetric DP with SKIP_LINE so missed phrases don't cascade
    if (P >= 3 && L <= P * 1.65) {
      const packingCost = dp[P - 1][L - 1];
      const symOps = alignWindowSymmetricDP({
        lines: lineInputs,
        clusters: clusterInputs,
        windowStartMs: phrases[0].startMs,
        windowEndMs: phrases[P - 1].endMs,
        useTimestampPrior: false,
        allowLineSkip: true,
        allowClusterSkip: true,
        allowMerge2Lines: true,
        allowMerge2Clusters: true,
        evaluatePhoneticMatch,
      });

      const hasSkippedLine = symOps.some((op) => op.kind === 'skip_line');
      if (hasSkippedLine) {
        let symEvalCost = 0;
        for (const op of symOps) {
          if (op.kind === 'skip_line') {
            const wLen = cleanLines[op.lineIndices[0]].split(/\s+/).filter(Boolean).length;
            symEvalCost += 4.5 + Math.min(3.1, wLen * 0.44);
          } else if (op.kind === 'skip_cluster') {
            symEvalCost += 4.9;
          } else {
            const ci0 = op.clusterIndices[0];
            const firstL = op.lineIndices[0];
            const lastL = op.lineIndices[op.lineIndices.length - 1];
            symEvalCost += groupCost(ci0, firstL, lastL);
          }
        }

        if (symEvalCost < packingCost - 0.6) {
          commitSymmetricOps(symOps);
          return;
        }
      }
    }

    phrases.forEach((p, pIdx) => {
      const r = assignedRanges[pIdx];
      const mergedText = cleanLines.slice(r.start, r.end + 1).join(' ');
      p.isInstrumentalOrVocalize = false;
      p.isMissingLyricGap = false;
      alignWordsToPhraseNoteBars(p, noteBars, mergedText, rawMonoPcm, sampleRate, pitchTrack);
    });
    return;
  }

  // Case C (P >= L with anomalies or P > L): Bidirectional Symmetric Alignment DP
  // Handles omitted text lines, extra adlib/chorus audio clusters (marked isMissingLyricGap -> Auto-Gen),
  // AND genuine mid-sentence split phrases WITHOUT greedy cascading shifts!
  const ops = alignWindowSymmetricDP({
    lines: lineInputs,
    clusters: clusterInputs,
    windowStartMs: phrases[0].startMs,
    windowEndMs: phrases[P - 1].endMs,
    useTimestampPrior: false,
    allowLineSkip: true,
    allowClusterSkip: true,
    allowMerge2Lines: false,
    allowMerge2Clusters: true,
    evaluatePhoneticMatch,
  });

  commitSymmetricOps(ops);
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
 * Extract embedded ID3v2 Title (TIT2) and Artist (TPE1) metadata frames if present
 */
export function extractEmbeddedMetadataFromBuffer(
  buffer: ArrayBuffer
): { title?: string; artist?: string } {
  const result: { title?: string; artist?: string } = {};
  try {
    const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 128 * 1024));
    const decoderLatin = new TextDecoder('iso-8859-1');
    const headerAscii = decoderLatin.decode(bytes);

    const readTextFrame = (frameId: string): string | undefined => {
      const idx = headerAscii.indexOf(frameId);
      if (idx < 0 || idx + 11 >= bytes.length) return undefined;
      const frameSize =
        (bytes[idx + 4] << 24) |
        (bytes[idx + 5] << 16) |
        (bytes[idx + 6] << 8) |
        bytes[idx + 7];
      if (frameSize <= 1 || frameSize > 512 || idx + 10 + frameSize > bytes.length) {
        return undefined;
      }
      const encoding = bytes[idx + 10];
      const payload = bytes.subarray(idx + 11, idx + 10 + frameSize);
      const decoder =
        encoding === 1 || encoding === 2
          ? new TextDecoder('utf-16')
          : new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(payload).replace(/\x00/g, '').trim();
      return text.length >= 2 ? text : undefined;
    };

    result.title = readTextFrame('TIT2');
    result.artist = readTextFrame('TPE1');
  } catch {
    // Ignore binary parsing errors
  }
  return result;
}

/**
 * Generate smart candidate search queries from complex YouTube/MP3/DAW/Stem filenames and user queries.
 * Handles:
 * - DAW & Stem exports: "Project_12_ANHS_EMS.vocal.wav", "Session_03_Ten_Bai_Hat_Master.mp3"
 * - "Song Title - Artist" (e.g. "Thích Thích - Phương Ly ft. JustaTee | Vụ Nổ Lớn.mp3")
 * - "Artist - Song Title_vocals - Part_1.wav" (e.g. "Hà Anh Tuấn x Phương Linh - Cơn Mưa Tình Yêu_vocals - Part_1.wav")
 * - Conjunction & stylized title variants: "anhs và ems" -> ["anhs ems", "anhs và ems"]
 *   (Prioritizes stopword-free queries first because LRCLIB SQLite FTS5 times out with HTTP 503 on "và"!)
 */
export function buildSmartLyricQueries(fileName: string): string[] {
  const withoutExt = fileName.replace(/\.(?:mp3|wav|flac|m4a|ogg|aac|webm|mp4)$/i, '');
  const primaryPart = withoutExt.split(/[|/]/)[0] || withoutExt;

  const stripNoise = (s: string) =>
    s
      .replace(/\[.*?\]|\(.*?\)/g, ' ')
      .replace(/[._-]+/g, ' ')
      .replace(
        /(?:^|\s)(?:project|proj|session|take|mix|stem|cut|bai|bài|no|file|track|part|pt|ver|version|vol|tap|tập|draft|final|master|export|render)\s*\d+(?=\s|$)/gi,
        ' '
      )
      .replace(
        /\b(ft\.?|feat\.?|prod\.?|vocals?|stems?|acapella|accompaniment|instrumental|isolated|no_?vocals?|other|drums?|bass|beat|full|nhac|nhạc|nen|nền|karaoke|official|music|video|lyrics?|audio|mv|hd|4k|mp3|wav|flac|m4a|ogg|128kbps|320kbps|44100hz|48000hz|48khz|44khz|16bit|24bit|\d+bpm|project|proj|session|master|final|draft|export|render|demo|record|recording|ghi_am|remix|cover|live|y2mate|snapsave|savefrom)\b/gi,
        ' '
      )
      .replace(/\s+x\s+/gi, ' ')
      // Remove leftover unmatched brackets/punctuation (e.g. "CẦN GÌ NÓI IU (" after splitting on "feat.")
      // which otherwise trigger LRCLIB FTS5 syntax errors / 503 ServerOverloaded
      .replace(/[()[\]{}|"“”!?,;:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const candidates: string[] = [];
  const pushUnique = (raw: string) => {
    const cleaned = raw.replace(/\s+/g, ' ').trim();
    if (
      cleaned.length >= 3 &&
      !candidates.some((c) => c.toLowerCase() === cleaned.toLowerCase()) &&
      !/^(audio|vocal|bai hat|test|sample|untitled|\d+)$/i.test(cleaned)
    ) {
      candidates.push(cleaned);
    }
  };

  const addCandidateWithVariants = (c: string) => {
    const cleaned = stripNoise(c);
    if (!cleaned || cleaned.length < 3) return;

    const leadingNumMatch = cleaned.match(/^\d{1,2}\s+(.{3,})$/);
    const baseForConj = leadingNumMatch ? leadingNumMatch[1] : cleaned;

    // Prioritize conjunction-free variant FIRST (e.g. "anhs ems" before "anhs và ems")
    // because LRCLIB's SQLite FTS5 index frequently throws HTTP 503 ServerOverloaded on "và"
    if (/(?:^|\s)(?:và|va|and|with|cùng|cung)(?=\s|$)|[&+]/i.test(baseForConj)) {
      const withoutConj = baseForConj
        .replace(/(?:^|\s)(?:và|va|and|with|cùng|cung)(?=\s|$)/gi, ' ')
        .replace(/[&+]/g, ' ');
      pushUnique(withoutConj);
    }

    if (leadingNumMatch) {
      pushUnique(leadingNumMatch[1]);
    }

    pushUnique(cleaned);

    if (/[&+]/.test(baseForConj)) {
      pushUnique(baseForConj.replace(/[&+]/g, ' và '));
    }
  };

  // 0. Vietnamese song alias mapping for colloquial or misnamed filenames
  const normPrimary = normalizeVietnameseSearch(primaryPart.replace(/[._-]+/g, ' '));
  if (/giua\s+troi\s+mang\s+di|troi\s+mang\s+di|troi\s+giau/i.test(normPrimary)) {
    pushUnique('Trời Giấu Trời Mang Đi AMEE ViruSs');
    pushUnique('Trời Giấu Trời Mang Đi');
    pushUnique('Giữa Đại Lộ Đông Tây Uyên Linh');
  }
  if (/dai\s+lo\s+dong\s+tay/i.test(normPrimary)) {
    pushUnique('Giữa Đại Lộ Đông Tây Uyên Linh');
    pushUnique('Giữa Đại Lộ Đông Tây');
  }
  if (/nang\s+tho|danh\s+roi\s+nu\s+cuoi/i.test(normPrimary)) {
    pushUnique('Nàng Thơ Hoàng Dũng');
    pushUnique('Nàng Thơ');
  }

  // 1. Clean primary part: strip bracketed annotations [feat. X], (official mv), etc. cleanly first
  const cleanPrimary = primaryPart
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const beforeFeat = (cleanPrimary || primaryPart).split(/\b(?:ft\.?|feat\.?)\b/i)[0] || cleanPrimary;
  addCandidateWithVariants(beforeFeat);

  // 2. Clean individual dash-separated segments (supports both "Title - Artist" and "Artist - Title - Part_1")
  const dashParts = (cleanPrimary || primaryPart)
    .split(/\s*-\s*/)
    .map((p) => stripNoise(p))
    .filter((p) => p.length >= 2);

  if (dashParts.length >= 2) {
    // First segment (Song Title in "Title - Artist")
    addCandidateWithVariants(dashParts[0]);
    // Second segment (Song Title in "Artist - Title")
    addCandidateWithVariants(dashParts[1]);
  }

  // 3. Full primary part cleaned
  addCandidateWithVariants(primaryPart);

  // 4. If no dashes were present and the cleaned primary candidate has >= 4 words (e.g. "QNT RZMas ANHS EMS"),
  // also add the last 2-3 words and first 2-3 words as fallback queries
  if (dashParts.length < 2 && candidates.length > 0) {
    const words = candidates[0].split(/\s+/).filter(Boolean);
    if (words.length >= 4) {
      pushUnique(words.slice(-2).join(' '));
      pushUnique(words.slice(-3).join(' '));
      pushUnique(words.slice(0, 3).join(' '));
    }
  }

  return candidates;
}

/**
 * Query open LRCLIB API (`https://lrclib.net/api/search`) using:
 * 1. Built-in Verified Synced LRC Registry (instant deterministic resolution for reference songs)
 * 2. LocalStorage Cloud LRC Cache (`CLOUD_LRC_CACHE_PREFIX`) keyed by normalized song query
 * 3. Multi-candidate smart queries with HTTP 503/429 retry backoff
 * 4. Strict `syncedLyrics` priority (`hasSyncBonus = 350`) so timestamped LRC always beats plainLyrics,
 *    preventing lyrics from shifting onto instrumental intros on full-beat tracks!
 */
async function resolveYouTubeQueryIfUrl(rawInput: string): Promise<string> {
  const trimmed = rawInput.trim();
  const isYtUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?v=)/i.test(trimmed);
  if (!isYtUrl || typeof fetch === 'undefined') return rawInput;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const json: any = await res.json();
      if (json?.title) {
        return json.author_name && !String(json.title).toLowerCase().includes(String(json.author_name).toLowerCase())
          ? `${json.author_name} - ${json.title}`
          : String(json.title);
      }
    }
  } catch {
    // Non-fatal
  }
  return rawInput;
}

export async function fetchAutoLyricsFromLrclib(
  fileName: string,
  durationMs: number
): Promise<{ syncedLyrics?: string; plainLyrics?: string; matchedTitle?: string } | null> {
  const effectiveName = await resolveYouTubeQueryIfUrl(fileName);

  // 1. Check Built-in Verified Synced LRC Registry first
  const builtinSynced = findBuiltinVerifiedSyncedLrc(effectiveName);
  if (builtinSynced) {
    return builtinSynced;
  }

  const queries = buildSmartLyricQueries(effectiveName);
  if (queries.length === 0) return null;

  // Also check if any candidate query matches our Built-in Verified Synced LRC Registry
  for (const q of queries) {
    const matchedBuiltin = findBuiltinVerifiedSyncedLrc(q);
    if (matchedBuiltin) return matchedBuiltin;
  }

  // 2. Check Cloud LRC LocalStorage Cache across candidate queries
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (const q of queries) {
        const cacheKey = `${CLOUD_LRC_CACHE_PREFIX}${normalizeVietnameseSearch(q)}`;
        const cachedRaw = window.localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && (parsed.syncedLyrics || parsed.plainLyrics)) {
            return parsed;
          }
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  if (typeof fetch === 'undefined') return null;

  const targetDurSec = durationMs / 1000;
  const normFile = normalizeVietnameseSearch(fileName.replace(/[._-]+/g, ' '));
  const normFileTokens = normFile.split(/\s+/).filter((t) => t.length >= 2);

  let bestPlainFallback: {
    plainLyrics: string;
    matchedTitle: string;
    score: number;
    queryKey: string;
  } | null = null;

  // Build request plan:
  // 1. Structured `track_name` + `artist_name` searches parsed from "Artist - Title" / "Title - Artist"
  //    (indexed column lookup — far less likely to hit LRCLIB's FTS5 `503 ServerOverloaded` than `q=`)
  // 2. Free-text `q=` searches from smart filename candidates
  const requestPlan: Array<{ url: string; normQuery: string }> = [];
  const pushRequest = (url: string, normQuery: string) => {
    if (!requestPlan.some((r) => r.url === url)) requestPlan.push({ url, normQuery });
  };
  const cleanSegment = (s: string) =>
    s
      .replace(/\.(?:mp3|wav|flac|m4a|ogg|aac|webm|mp4)$/i, '')
      .replace(/\[.*?\]|\(.*?\)/g, ' ')
      .replace(/\b(?:ft\.?|feat\.?)\s.*$/i, ' ')
      .replace(/[_()[\]{}|"“”!?,;:]+/g, ' ')
      .replace(
        /\b(?:official|music|video|mv|lyrics?|audio|hd|4k|vocals?|stems?|karaoke|beat|full|instrumental|acapella|remix|cover|live|y2mate|snapsave|savefrom)\b/gi,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();
  const dashSegments = fileName
    .replace(/\.(?:mp3|wav|flac|m4a|ogg|aac|webm|mp4)$/i, '')
    .split(/\s+[-–—|]\s+/)
    .map(cleanSegment)
    .filter((s) => s.length >= 2);
  if (dashSegments.length >= 2) {
    const [a, b] = dashSegments;
    pushRequest(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(b)}&artist_name=${encodeURIComponent(a)}`,
      normalizeVietnameseSearch(`${a} ${b}`)
    );
    pushRequest(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(a)}&artist_name=${encodeURIComponent(b)}`,
      normalizeVietnameseSearch(`${a} ${b}`)
    );
  }
  queries.slice(0, 6).forEach((q) => {
    pushRequest(
      `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
      normalizeVietnameseSearch(q)
    );
  });

  // Overall time budget so a busy LRCLIB never blocks analysis forever
  const deadline = Date.now() + 28000;

  for (const req of requestPlan) {
    if (Date.now() > deadline) break;
    const normQuery = req.normQuery;
    const normQueryTokens = normQuery.split(/\s+/).filter((t) => t.length >= 2);

    let list: any[] | null = null;

    // Automatic retry with exponential backoff on HTTP 503 (LRCLIB ServerOverloaded), 429,
    // or network/CORS failures (browser 503 responses can surface as TypeError)
    for (let attempt = 0; attempt < 4 && Date.now() < deadline; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(req.url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timer);

        if (res.status === 503 || res.status === 429 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, 450 * Math.pow(1.8, attempt)));
          continue;
        }
        if (!res.ok) break;

        const data = await res.json();
        if (Array.isArray(data)) {
          list = data;
        }
        break;
      } catch {
        clearTimeout(timer);
        await new Promise((r) => setTimeout(r, 400 * Math.pow(1.8, attempt)));
      }
    }

    if (!list || list.length === 0) continue;

    const scored = list
      .filter((item: any) => item && (item.syncedLyrics || item.plainLyrics))
      // Reject results whose track title does not appear in the filename/query
      // (prevents an artist-only query like "Wxrdie" from returning a different song)
      .filter((item: any) => {
        const coreTokens = normalizeVietnameseSearch(
          String(item.trackName || '').replace(/\[.*?\]|\(.*?\)/g, ' ')
        )
          .split(/\s+/)
          .filter((t) => t.length >= 2 && !/^(feat|ft|official|mv|video|audio|lyrics?)$/.test(t));
        if (coreTokens.length === 0) return false;
        const hits = coreTokens.filter(
          (t) => normFileTokens.includes(t) || normQueryTokens.includes(t)
        ).length;
        return hits / coreTokens.length >= 0.6;
      })
      .map((item: any) => {
        const durDiff = Math.abs((Number(item.duration) || targetDurSec) - targetDurSec);
        // Timestamped syncedLyrics is strongly prioritized (+350) over plainLyrics
        // so full-beat tracks with instrumental intros never align line 1 onto 00:01!
        const hasSyncBonus = item.syncedLyrics ? 350 : 0;

        const rawTrack = String(item.trackName || '');
        const normTrack = normalizeVietnameseSearch(rawTrack);
        const coreTrack = normalizeVietnameseSearch(
          rawTrack.replace(/\[.*?\]|\(.*?\)/g, ' ')
        );
        const normArtist = normalizeVietnameseSearch(String(item.artistName || ''));

        const exactTitleBonus =
          (normTrack.length >= 3 && normFile.includes(normTrack)) ||
          (coreTrack.length >= 3 && normFile.includes(coreTrack))
            ? 90
            : 0;

        const artistTokens = normArtist.split(/\s+/).filter((t) => t.length >= 2);
        const matchedArtistTokens = artistTokens.filter((tk) =>
          normFileTokens.includes(tk)
        ).length;
        const artistMatchBonus =
          normArtist.length >= 3 && normFile.includes(normArtist)
            ? 45
            : matchedArtistTokens >= 2
            ? Math.min(40, matchedArtistTokens * 10)
            : 0;

        const matchedQueryTokens = normQueryTokens.filter(
          (tk) => normTrack.includes(tk) || normArtist.includes(tk)
        ).length;
        const tokenOverlapBonus = matchedQueryTokens * 18;

        return {
          item,
          hasSync: Boolean(item.syncedLyrics),
          score:
            hasSyncBonus +
            exactTitleBonus +
            artistMatchBonus +
            tokenOverlapBonus -
            durDiff * 0.85,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const top = scored[0];
      const matchedTitle = [top.item.trackName, top.item.artistName]
        .filter(Boolean)
        .join(' – ');

      if (top.hasSync && top.item.syncedLyrics) {
        const payload = {
          syncedLyrics: String(top.item.syncedLyrics),
          plainLyrics: top.item.plainLyrics ? String(top.item.plainLyrics) : undefined,
          matchedTitle,
        };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(
              `${CLOUD_LRC_CACHE_PREFIX}${normQuery}`,
              JSON.stringify(payload)
            );
          }
        } catch {
          // Ignore quota error
        }
        return payload;
      }

      // If this query only returned unsynced plainLyrics, save as fallback and continue
      // checking the next query (e.g. "Cơn Mưa Tình Yêu") in case it has syncedLyrics!
      if (
        top.item.plainLyrics &&
        (!bestPlainFallback || top.score > bestPlainFallback.score)
      ) {
        bestPlainFallback = {
          plainLyrics: String(top.item.plainLyrics),
          matchedTitle,
          score: top.score,
          queryKey: normQuery,
        };
      }
    }
  }

  if (bestPlainFallback) {
    const payload = {
      plainLyrics: bestPlainFallback.plainLyrics,
      matchedTitle: bestPlainFallback.matchedTitle,
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `${CLOUD_LRC_CACHE_PREFIX}${bestPlainFallback.queryKey}`,
          JSON.stringify(payload)
        );
      }
    } catch {
      // Ignore quota error
    }
    return payload;
  }

  return null;
}

/**
 * Search and rank candidate song lyrics from:
 * 1. Built-in Verified Synced LRC Registry (100% deterministic & offline)
 * 2. LocalStorage Cloud / User Lyric Cache
 * 3. LRCLIB Online API (multi-candidate search with duration matching)
 *
 * Returns a sorted list of candidate tracks with confidence percentage,
 * duration discrepancy, and sync status, enabling 1-click song disambiguation.
 */
export async function searchSongLyricCandidates(
  fileName: string,
  durationMs: number,
  customQuery?: string
): Promise<ISongLyricCandidate[]> {
  const targetDurSec = durationMs > 0 ? durationMs / 1000 : 0;
  const normFile = normalizeVietnameseSearch(fileName.replace(/[._-]+/g, ' '));
  const normFileTokens = normFile.split(/\s+/).filter((t) => t.length >= 2);
  const normCustom = customQuery ? normalizeVietnameseSearch(customQuery) : '';
  const normCustomTokens = normCustom ? normCustom.split(/\s+/).filter((t) => t.length >= 2) : [];

  const candidates: ISongLyricCandidate[] = [];
  const seenIds = new Set<string>();

  const addCandidate = (cand: ISongLyricCandidate) => {
    const key = normalizeVietnameseSearch(`${cand.trackName} ${cand.artistName}`);
    if (seenIds.has(key)) {
      const existingIdx = candidates.findIndex(
        (c) => normalizeVietnameseSearch(`${c.trackName} ${c.artistName}`) === key
      );
      if (existingIdx >= 0 && !candidates[existingIdx].hasSyncedLyrics && cand.hasSyncedLyrics) {
        candidates[existingIdx] = cand;
      }
      return;
    }
    seenIds.add(key);
    candidates.push(cand);
  };

  // 1. Check Built-in Verified Registry
  for (const entry of BUILTIN_VERIFIED_SYNCED_LRC) {
    const normTitle = normalizeVietnameseSearch(entry.matchedTitle);
    const titleParts = entry.matchedTitle.split(/\s+[–—\-]\s+/);
    const trackName = titleParts[0]?.trim() || entry.matchedTitle;
    const artistName = titleParts[1]?.trim() || 'Ca sĩ gốc';
    const normTrack = normalizeVietnameseSearch(trackName);

    const isCustomMatch =
      normCustom && (entry.matchKeywords.some((kw) => normCustom.includes(kw)) || normTitle.includes(normCustom));
    const isFileMatch = entry.matchKeywords.some((kw) => normFile.includes(kw)) || normTitle.includes(normFile);

    if (isCustomMatch || isFileMatch || !customQuery) {
      const trackTokens = normTrack.split(/\s+/).filter((t) => t.length >= 2);
      const activeTokens = normCustomTokens.length > 0 ? normCustomTokens : normFileTokens;
      const matchedTokens = trackTokens.filter((tk) => activeTokens.includes(tk)).length;
      const overlapPct = trackTokens.length > 0 ? (matchedTokens / trackTokens.length) * 100 : 0;

      let confidencePct = isCustomMatch ? 98 : Math.max(25, Math.round(overlapPct));
      if (isFileMatch && confidencePct < 85) confidencePct = 90;

      const confidenceLevel: 'high' | 'medium' | 'low' =
        confidencePct >= 75 ? 'high' : confidencePct >= 45 ? 'medium' : 'low';

      addCandidate({
        id: `builtin_${entry.matchKeywords[0].replace(/\s+/g, '_')}`,
        trackName,
        artistName,
        durationSec: Math.round(targetDurSec),
        durationDiffSec: 0,
        hasSyncedLyrics: true,
        confidencePct,
        confidenceLevel,
        syncedLyrics: entry.syncedLyrics,
        source: 'builtin',
        matchReasonVi: isCustomMatch
          ? 'Khớp chính xác với từ khóa tra cứu (Lời chuẩn 100% .LRC)'
          : isFileMatch
          ? 'Bài hát mẫu có sẵn trong hệ thống (Lời chuẩn 100% .LRC)'
          : 'Bài hát mẫu tham khảo trong kho cục bộ',
      });
    }
  }

  // 2. Query LRCLIB Cloud if online
  if (typeof fetch !== 'undefined') {
    const queries = customQuery?.trim()
      ? [customQuery.trim()]
      : buildSmartLyricQueries(fileName);

    const deadline = Date.now() + 5000;
    for (const q of queries.slice(0, 3)) {
      if (Date.now() > deadline) break;
      const normQuery = normalizeVietnameseSearch(q);
      const normQueryTokens = normQuery.split(/\s+/).filter((t) => t.length >= 2);

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timer);

        if (!res.ok) continue;
        const list = await res.json();
        if (!Array.isArray(list)) continue;

        for (const item of list.slice(0, 5)) {
          if (!item || (!item.syncedLyrics && !item.plainLyrics)) continue;
          const rawTrack = String(item.trackName || '').trim();
          const rawArtist = String(item.artistName || '').trim();
          if (!rawTrack) continue;

          const normTrack = normalizeVietnameseSearch(rawTrack);
          const trackTokens = normTrack.split(/\s+/).filter((t) => t.length >= 2);
          const activeTokens = normCustomTokens.length > 0 ? normCustomTokens : normFileTokens;
          const matchedCount = trackTokens.filter(
            (t) => activeTokens.includes(t) || normQueryTokens.includes(t)
          ).length;
          const tokenRatio = trackTokens.length > 0 ? matchedCount / trackTokens.length : 0;

          if (tokenRatio < 0.3 && !customQuery) continue;

          const itemDurSec = Number(item.duration) || targetDurSec;
          const durDiff = Math.abs(itemDurSec - targetDurSec);

          let score = Math.round(tokenRatio * 55);
          if (item.syncedLyrics) score += 30;
          if (durDiff < 15) score += 15;
          else if (durDiff > 90) score -= 15;

          const confidencePct = Math.min(100, Math.max(10, score));
          const confidenceLevel: 'high' | 'medium' | 'low' =
            confidencePct >= 75 ? 'high' : confidencePct >= 45 ? 'medium' : 'low';

          addCandidate({
            id: `lrclib_${item.id || Math.random().toString(36).substring(2, 9)}`,
            trackName: rawTrack,
            artistName: rawArtist || 'Nhiều nghệ sĩ',
            durationSec: Math.round(itemDurSec),
            durationDiffSec: Math.round(durDiff),
            hasSyncedLyrics: Boolean(item.syncedLyrics),
            confidencePct,
            confidenceLevel,
            syncedLyrics: item.syncedLyrics ? String(item.syncedLyrics) : undefined,
            plainLyrics: item.plainLyrics ? String(item.plainLyrics) : undefined,
            source: 'lrclib',
            matchReasonVi: item.syncedLyrics
              ? `Khớp từ kho LRCLIB (${Math.round(itemDurSec / 60)}:${String(Math.round(itemDurSec % 60)).padStart(2, '0')})`
              : 'Lời dạng văn bản từ LRCLIB (chưa có timestamp)',
          });
        }
      } catch {
        // Network or abort error
      }
    }
  }

  // Sort candidates by confidence descending
  candidates.sort((a, b) => {
    if (b.confidencePct !== a.confidencePct) return b.confidencePct - a.confidencePct;
    if (b.hasSyncedLyrics !== a.hasSyncedLyrics) return b.hasSyncedLyrics ? 1 : -1;
    return (a.durationDiffSec ?? 999) - (b.durationDiffSec ?? 999);
  });

  return candidates.slice(0, 8);
}

/**
 * Re-align lyrics to an existing analysis result using an updated lyric candidate or custom LRC.
 * Preserves pitchTrack and raw audio, while regenerating phrase words, note assignments,
 * musical sections, duet classification, and Vietnamese tone prosody verification.
 */
export function realignLyricsToAnalysisResult(
  currentResult: IVocalAnalysisResult,
  lyricsText: string,
  isSyncedLrc: boolean,
  matchedTrackTitle?: string
): IVocalAnalysisResult {
  const clonedPhrases: IVocalPhrase[] = currentResult.phrases.map((p) => ({
    ...p,
    words: p.words ? p.words.map((w) => ({ ...w })) : undefined,
  }));
  const clonedBars: IVocalNoteBar[] = currentResult.noteBars.map((b) => ({ ...b }));

  const rawMonoPcm =
    typeof currentResult.audioBuffer?.getChannelData === 'function'
      ? currentResult.audioBuffer.getChannelData(0)
      : new Float32Array(0);

  if (isSyncedLrc) {
    const lrcLines = parseLrcContent(lyricsText);
    if (lrcLines.length > 0) {
      alignLrcLinesToPhrases(
        clonedPhrases,
        clonedBars,
        lrcLines,
        rawMonoPcm,
        currentResult.sampleRate,
        currentResult.pitchTrack,
        currentResult.durationMs
      );
    } else {
      alignPlainTextToPhrases(
        clonedPhrases,
        clonedBars,
        lyricsText,
        rawMonoPcm,
        currentResult.sampleRate,
        currentResult.pitchTrack
      );
    }
  } else {
    alignPlainTextToPhrases(
      clonedPhrases,
      clonedBars,
      lyricsText,
      rawMonoPcm,
      currentResult.sampleRate,
      currentResult.pitchTrack
    );
  }

  classifyPhraseSectionsAndContours(
    clonedPhrases,
    clonedBars,
    currentResult.durationMs,
    currentResult.vocalRange.lowestMidi,
    currentResult.vocalRange.highestMidi
  );

  classifyDuetSingerVoices(
    clonedPhrases,
    clonedBars,
    currentResult.pitchTrack,
    currentResult.fileName
  );

  // Compute deep tone prosody verification
  let totalTransitions = 0;
  let totalConcordant = 0;
  const flaggedPhrases: Array<{ phraseIndex: number; word: string; reason: string }> = [];

  clonedPhrases.forEach((p) => {
    if (p.isInstrumentalOrVocalize || !p.words || p.words.length < 2) return;
    const tokens = p.words.map((w) => w.text);
    const midis = p.words.map((w) => w.midi);
    const report = computePhraseToneMelodicHarmony(tokens, midis);
    totalTransitions += report.totalTransitions;
    totalConcordant += report.concordantTransitions;
    if (report.invertedViolationsCount > 0) {
      const invertedT = report.transitions.find((t) => t.isInverted);
      if (invertedT) {
        flaggedPhrases.push({
          phraseIndex: p.phraseIndex,
          word: `${invertedT.wordA} → ${invertedT.wordB}`,
          reason: invertedT.explanationVi,
        });
      }
    }
  });

  const prosodyConcordanceRatio =
    totalTransitions > 0 ? Math.round((totalConcordant / totalTransitions) * 100) : 95;

  const nextTitle = matchedTrackTitle || currentResult.matchedTrackTitle;
  const alignmentAudit = auditLyricAlignmentHealth(clonedPhrases, clonedBars);

  const updatedResult: IVocalAnalysisResult = {
    ...currentResult,
    phrases: clonedPhrases,
    noteBars: clonedBars,
    lyricSource: isSyncedLrc ? 'auto_lrclib' : 'manual',
    lyricStatus: alignmentAudit.status === 'healthy' ? 'complete' : 'partial',
    matchedTrackTitle: nextTitle,
    candidateConfidence: alignmentAudit.status === 'mismatch_suspected' ? 'low' : 'high',
    candidateWarning:
      alignmentAudit.status === 'mismatch_suspected' ? alignmentAudit.summaryVi : undefined,
    alignmentAudit,
    deepVerification: {
      toneHarmonyScorePct: prosodyConcordanceRatio,
      prosodyConcordanceRatio,
      flaggedPhrasesCount: flaggedPhrases.length,
      flaggedPhrases: flaggedPhrases.slice(0, 5),
      analysisMode: 'deep_verification',
    },
  };

  if (alignmentAudit.status !== 'mismatch_suspected') {
    saveLyricsToLocalCache(updatedResult);
  }
  return updatedResult;
}

/**
 * Strip mismatched LRC timestamps from the current lyrics and re-align them
 * strictly against actual vocal NoteBar density (`alignPlainTextToPhrases`).
 */
export function realignStripTimestampsFromCurrentLyrics(
  currentResult: IVocalAnalysisResult
): IVocalAnalysisResult {
  const rawLines = currentResult.phrases
    .filter((p) => !p.isMissingLyricGap && !p.isInstrumentalOrVocalize && p.lyricText && !p.lyricText.startsWith('Nguyên âm:'))
    .map((p) => p.lyricText!.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return currentResult;
  return realignLyricsToAnalysisResult(
    currentResult,
    rawLines.join('\n'),
    false,
    currentResult.matchedTrackTitle
  );
}

/**
 * Duet Singer Diarization (`classifyDuetSingerVoices`):
 * Clusters phrase feature vectors `[avgMidi, meanF1Hz, meanF2Hz, pitchSpread]` using 2-Means (K=2)
 * into `voice_a` (Giọng A - Nam/Trầm ấm), `voice_b` (Giọng B - Nữ/Cao sáng), `both` (Song ca / Hòa giọng),
 * or `solo` (Đơn ca).
 */
export function classifyDuetSingerVoices(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  _pitchTrack: IReferencePitchPoint[] = [],
  fileName = ''
): void {
  if (phrases.length === 0) return;

  const vocalPhrases = phrases.filter((p) => !p.isInstrumentalOrVocalize);
  if (vocalPhrases.length < 2) {
    phrases.forEach((p) => {
      p.singerId = 'solo';
      p.singerLabel = 'Đơn ca';
    });
    return;
  }

  // Extract acoustic-formant feature vector per phrase
  const features = vocalPhrases.map((p) => {
    const pBars = noteBars.filter((b) => {
      const mid = (b.startTimeMs + b.endTimeMs) / 2;
      return mid >= p.startMs - 60 && mid <= p.endMs + 60;
    });
    const minMidi = pBars.length > 0 ? Math.min(...pBars.map((b) => b.midi)) : p.avgMidi;
    const maxMidi = pBars.length > 0 ? Math.max(...pBars.map((b) => b.midi)) : p.avgMidi;
    const spreadSemitones = Math.max(0, maxMidi - minMidi);

    let f1Sum = 0;
    let f2Sum = 0;
    let fCount = 0;
    (p.words || []).forEach((w) => {
      if (w.formantsHz && w.formantsHz[0] > 0 && w.formantsHz[1] > 0) {
        f1Sum += w.formantsHz[0];
        f2Sum += w.formantsHz[1];
        fCount++;
      }
    });
    const meanF1 = fCount > 0 ? f1Sum / fCount : 540;
    const meanF2 = fCount > 0 ? f2Sum / fCount : 1480;

    // Composite vocal register index combining F0 (MIDI) and vocal-tract length (F1/F2 formants)
    const registerIndex =
      p.avgMidi + (meanF2 - 1450) / 150 + (meanF1 - 530) / 110;

    return {
      phrase: p,
      avgMidi: p.avgMidi,
      meanF1,
      meanF2,
      spreadSemitones,
      registerIndex,
    };
  });

  const sortedIndices = [...features]
    .map((f) => f.registerIndex)
    .sort((a, b) => a - b);
  let centroidLow = sortedIndices[Math.floor(sortedIndices.length * 0.22)];
  let centroidHigh = sortedIndices[Math.min(sortedIndices.length - 1, Math.floor(sortedIndices.length * 0.78))];

  // 1D K-Means (K = 2) on registerIndex
  for (let iter = 0; iter < 8; iter++) {
    let sumLow = 0;
    let countLow = 0;
    let sumHigh = 0;
    let countHigh = 0;

    for (const f of features) {
      if (Math.abs(f.registerIndex - centroidLow) <= Math.abs(f.registerIndex - centroidHigh)) {
        sumLow += f.registerIndex;
        countLow++;
      } else {
        sumHigh += f.registerIndex;
        countHigh++;
      }
    }

    if (countLow > 0) centroidLow = sumLow / countLow;
    if (countHigh > 0) centroidHigh = sumHigh / countHigh;
  }

  if (centroidLow > centroidHigh) {
    const tmp = centroidLow;
    centroidLow = centroidHigh;
    centroidHigh = tmp;
  }

  const lowGroup = features.filter(
    (f) => Math.abs(f.registerIndex - centroidLow) <= Math.abs(f.registerIndex - centroidHigh)
  );
  const highGroup = features.filter(
    (f) => Math.abs(f.registerIndex - centroidLow) > Math.abs(f.registerIndex - centroidHigh)
  );

  const meanMidiLow =
    lowGroup.length > 0
      ? lowGroup.reduce((s, f) => s + f.avgMidi, 0) / lowGroup.length
      : centroidLow;
  const meanMidiHigh =
    highGroup.length > 0
      ? highGroup.reduce((s, f) => s + f.avgMidi, 0) / highGroup.length
      : centroidHigh;

  const midiSeparation = meanMidiHigh - meanMidiLow;
  const registerSeparation = centroidHigh - centroidLow;
  const hasDuetFilenameCue =
    /(?:^|[\s_\-.])(?:x|ft|feat|va|và|song\s*ca|duet)(?=[\s_\-.]|$)/i.test(fileName) ||
    fileName.includes('&');

  const minClusterSize = vocalPhrases.length >= 6 ? Math.max(2, Math.floor(vocalPhrases.length * 0.14)) : 1;
  const isDuetTrack =
    lowGroup.length >= minClusterSize &&
    highGroup.length >= minClusterSize &&
    (registerSeparation >= 4.2 || midiSeparation >= 4.0 || (hasDuetFilenameCue && registerSeparation >= 2.8));

  if (!isDuetTrack) {
    phrases.forEach((p) => {
      p.singerId = 'solo';
      p.singerLabel = 'Đơn ca';
    });
    return;
  }

  const labelA = meanMidiLow <= 59.5 ? 'Giọng A (Nam / Trầm)' : 'Giọng A (Trầm ấm)';
  const labelB = meanMidiHigh >= 61.5 ? 'Giọng B (Nữ / Cao)' : 'Giọng B (Cao sáng)';
  const midRegister = (centroidLow + centroidHigh) / 2;

  features.forEach((f) => {
    const isChorusOrClimax =
      f.phrase.sectionType === 'chorus' || f.phrase.sectionType === 'climax';
    // Harmony / rapid duet exchange phrase spanning both registers
    if (
      f.spreadSemitones >= 9 &&
      (isChorusOrClimax || Math.abs(f.registerIndex - midRegister) <= 1.8)
    ) {
      f.phrase.singerId = 'both';
      f.phrase.singerLabel = 'Song ca (Hòa giọng)';
    } else if (f.registerIndex <= midRegister) {
      f.phrase.singerId = 'voice_a';
      f.phrase.singerLabel = labelA;
    } else {
      f.phrase.singerId = 'voice_b';
      f.phrase.singerLabel = labelB;
    }
  });

  // Temporal smoothing for isolated 1-phrase boundary jitter within the same section
  for (let i = 1; i < vocalPhrases.length - 1; i++) {
    const prev = vocalPhrases[i - 1];
    const curr = vocalPhrases[i];
    const next = vocalPhrases[i + 1];
    if (
      curr.singerId !== 'both' &&
      prev.singerId === next.singerId &&
      curr.singerId !== prev.singerId &&
      curr.sectionType === prev.sectionType &&
      Math.abs(curr.avgMidi - prev.avgMidi) <= 1.8
    ) {
      curr.singerId = prev.singerId;
      curr.singerLabel = prev.singerLabel;
    }
  }

  phrases.forEach((p) => {
    if (!p.singerId) {
      p.singerId = 'solo';
      p.singerLabel = 'Nhạc dạo / Ngân';
    }
  });
}
/**
 * Helper to persist phrases & lyric source into localStorage
 */
function persistPhrasesToLocalCache(params: {
  fileName: string;
  durationMs: number;
  lyricSource: LyricSourceType;
  matchedTrackTitle?: string;
  phrases: IVocalPhrase[];
}): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const hasRealLyric = params.phrases.some(
      (p) =>
        p.lyricText &&
        !p.lyricText.startsWith('Nguyên âm:') &&
        !p.lyricText.startsWith('🎵')
    );
    if (!hasRealLyric) return;

    const key = `${LYRIC_CACHE_PREFIX}${params.fileName}_${Math.round(params.durationMs / 1000)}`;
    const payload: ICachedSongLyrics = {
      lyricSource: params.lyricSource,
      matchedTrackTitle: params.matchedTrackTitle,
      phrases: params.phrases.map((p) => ({
        phraseIndex: p.phraseIndex,
        startMs: p.startMs,
        endMs: p.endMs,
        lyricText: p.lyricText || '',
        isInstrumentalOrVocalize: p.isInstrumentalOrVocalize,
        isAutoGeneratedMissing: p.isAutoGeneratedMissing,
        autoGenSource: p.autoGenSource,
        isRecoveredByDp: p.isRecoveredByDp,
        isMissingLyricGap: p.isMissingLyricGap,
        alignmentIssueDetailVi: p.alignmentIssueDetailVi,
      })),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Save user-edited or imported lyrics & phrase boundaries to localStorage
 */
export function saveLyricsToLocalCache(result: IVocalAnalysisResult): void {
  persistPhrasesToLocalCache({
    fileName: result.fileName,
    durationMs: result.durationMs,
    lyricSource: result.lyricSource || 'manual',
    matchedTrackTitle: result.matchedTrackTitle,
    phrases: result.phrases,
  });
}

/**
 * Load cached lyrics for a song if previously customized or fetched from LRCLIB
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
    const parsed = JSON.parse(raw) as ICachedSongLyrics;
    if (!parsed || !Array.isArray(parsed.phrases) || parsed.phrases.length === 0) {
      return null;
    }
    // Never treat pure acoustic vowel fallbacks ("Nguyên âm: ...") as cached lyrics
    const hasRealLyric = parsed.phrases.some(
      (p) =>
        p.lyricText &&
        !p.lyricText.startsWith('Nguyên âm:') &&
        !p.lyricText.startsWith('🎵')
    );
    if (!hasRealLyric) return null;

    // Invalidate stale cache if the cached track contradicts the actual filename
    // (e.g. filename is "giữa trời mang đi" but cached title contains "Nàng Thơ")
    const normFile = normalizeVietnameseSearch(fileName.replace(/[._-]+/g, ' '));
    if (parsed.matchedTrackTitle) {
      const normCached = normalizeVietnameseSearch(parsed.matchedTrackTitle);
      const isContradiction =
        /nang\s+tho/.test(normCached) &&
        /troi\s+mang\s+di|giua\s+troi|troi\s+giau/.test(normFile);
      if (isContradiction) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore
        }
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Master pipeline called during `vocalFileAnalysisService.analyzeVocalAudio`
 * Performs:
 * 1. Multi-tier automatic lyric resolution (Cache -> Builtin -> ID3/Vorbis -> LRCLIB -> Acoustic)
 * 2. LRC-Guided Breath-Snapped Phrase Re-segmentation (1 lyric sentence = 1 phrase, zero bleeding)
 * 3. Syllable-Onset NoteBar Subdivision & Phonology-Aware DP Word-to-Note Alignment
 * 4. Contiguous Musical Block Section Landmarking
 */
export interface IPopulatedLyricResult {
  lyricSource: LyricSourceType;
  lyricStatus: LyricCompletenessStatus;
  matchedTrackTitle?: string;
  candidates?: ISongLyricCandidate[];
  candidateConfidence?: 'high' | 'medium' | 'low';
  candidateWarning?: string;
  alignmentAudit?: IAlignmentHealthReport;
  deepVerification?: {
    toneHarmonyScorePct: number;
    prosodyConcordanceRatio: number;
    flaggedPhrasesCount: number;
    flaggedPhrases: Array<{ phraseIndex: number; word: string; reason: string }>;
    analysisMode: 'fast' | 'deep_verification';
  };
}

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
}): Promise<IPopulatedLyricResult> {
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

  const finalizeSections = () => {
    classifyPhraseSectionsAndContours(phrases, noteBars, durationMs, lowestMidi, highestMidi);
    classifyDuetSingerVoices(phrases, noteBars, pitchTrack, fileName);
  };

  const normFile = normalizeVietnameseSearch(fileName.replace(/[._-]+/g, ' '));
  const normFileTokens = normFile.split(/\s+/).filter((t) => t.length >= 2);

  const checkConfidence = (matchedTitle?: string): {
    confidence: 'high' | 'medium' | 'low';
    warning?: string;
  } => {
    if (!matchedTitle) return { confidence: 'medium' };
    const normMatched = normalizeVietnameseSearch(matchedTitle);
    const matchedTokens = normMatched.split(/\s+/).filter((t) => t.length >= 2);
    const overlapCount = matchedTokens.filter((t) => normFileTokens.includes(t)).length;
    const ratio = matchedTokens.length > 0 ? overlapCount / matchedTokens.length : 0;
    if (ratio >= 0.4) {
      return { confidence: 'high' };
    } else if (ratio >= 0.2) {
      return {
        confidence: 'medium',
        warning: `AI đang khớp với bài "${matchedTitle}" (Tên file: "${fileName}"). Bạn có thể kiểm tra lại trong danh sách bài hát gợi ý.`,
      };
    } else {
      return {
        confidence: 'low',
        warning: `AI đang khớp với bài "${matchedTitle}", nhưng tên file là "${fileName}". Nếu bị sai bài, bạn có thể bấm "Đổi bài khác" để chọn lại ngay.`,
      };
    }
  };

  const computeDeepProsody = () => {
    let totalTransitions = 0;
    let totalConcordant = 0;
    const flaggedPhrases: Array<{ phraseIndex: number; word: string; reason: string }> = [];

    phrases.forEach((p) => {
      if (p.isInstrumentalOrVocalize || !p.words || p.words.length < 2) return;
      const tokens = p.words.map((w) => w.text);
      const midis = p.words.map((w) => w.midi);
      const report = computePhraseToneMelodicHarmony(tokens, midis);
      totalTransitions += report.totalTransitions;
      totalConcordant += report.concordantTransitions;
      if (report.invertedViolationsCount > 0) {
        const inv = report.transitions.find((t) => t.isInverted);
        if (inv) {
          flaggedPhrases.push({
            phraseIndex: p.phraseIndex,
            word: `${inv.wordA} → ${inv.wordB}`,
            reason: inv.explanationVi,
          });
        }
      }
    });

    const ratio = totalTransitions > 0 ? Math.round((totalConcordant / totalTransitions) * 100) : 95;
    return {
      toneHarmonyScorePct: ratio,
      prosodyConcordanceRatio: ratio,
      flaggedPhrasesCount: flaggedPhrases.length,
      flaggedPhrases: flaggedPhrases.slice(0, 5),
      analysisMode: 'deep_verification' as const,
    };
  };

  if (onProgress) {
    onProgress(
      92,
      'Giai đoạn 6/7: Đang truy vấn lời bài hát đồng bộ (LRC) & trích xuất dấu vân tay âm vị...'
    );
  }

  // Deep Acoustic-Phonetic Fingerprinting across all phrase & NoteBar clusters asynchronously
  // so LRC/YouTube/Plain alignment breaks ties using F1/F2 mouth shapes + checked stops without cascade!
  const baseClustersForProfiling = [
    ...phrases.map((p) => ({
      bars: getPhraseNoteBarsStrict(p, noteBars),
      startMs: p.startMs,
      endMs: p.endMs,
    })),
    ...clusterNoteBarsBySilence(noteBars, 380, 6200).map((bars) => ({
      bars,
      startMs: bars[0].startTimeMs,
      endMs: bars[bars.length - 1].endTimeMs,
    })),
  ];
  const precomputedProfiles = await buildClusterPhoneticProfilesAsync({
    clusters: baseClustersForProfiling,
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    onProgress,
  });

  // Pre-gather multi-candidate songs so user has instant switcher options
  let candidates: ISongLyricCandidate[] = [];
  try {
    candidates = await searchSongLyricCandidates(fileName, durationMs);
  } catch {
    // Non-fatal
  }

  // 1. Layer 1A: Check Built-in Verified Synced LRC Registry FIRST
  // (Ensures verified ground-truth songs never get overridden by stale/corrupt browser cache)
  const builtinDirect = findBuiltinVerifiedSyncedLrc(fileName);
  if (builtinDirect) {
    const lrcLines = parseLrcContent(builtinDirect.syncedLyrics);
    if (lrcLines.length > 0) {
      if (onProgress) {
        onProgress(
          97,
          'Giai đoạn 7/7: Đối chiếu lời LRC với dấu vân tay âm vị & Quy hoạch động chống lệch dây chuyền...'
        );
      }
      alignLrcLinesToPhrases(
        phrases,
        noteBars,
        lrcLines,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
        durationMs,
        precomputedProfiles
      );
      finalizeSections();
      const audit = auditLyricAlignmentHealth(phrases, noteBars);
      if (audit.status !== 'mismatch_suspected') {
        persistPhrasesToLocalCache({
          fileName,
          durationMs,
          lyricSource: 'demo_builtin',
          matchedTrackTitle: builtinDirect.matchedTitle,
          phrases,
        });
      }
      const conf = checkConfidence(builtinDirect.matchedTitle);
      return {
        lyricSource: 'demo_builtin',
        lyricStatus: audit.status === 'healthy' ? 'complete' : 'partial',
        matchedTrackTitle: builtinDirect.matchedTitle,
        candidates,
        candidateConfidence: audit.status === 'mismatch_suspected' ? 'low' : conf.confidence,
        candidateWarning: audit.status === 'mismatch_suspected' ? audit.summaryVi : conf.warning,
        alignmentAudit: audit,
        deepVerification: computeDeepProsody(),
      };
    }
  }

  // 2. Layer 1B: Check LocalStorage user/cloud cache
  const cached = loadLyricsFromLocalCache(fileName, durationMs);
  if (cached) {
    if (cached.phrases.length === phrases.length) {
      phrases.forEach((p, idx) => {
        const cp = cached.phrases[idx];
        p.isInstrumentalOrVocalize = cp.isInstrumentalOrVocalize;
        p.isAutoGeneratedMissing = cp.isAutoGeneratedMissing;
        p.autoGenSource = cp.autoGenSource;
        p.isRecoveredByDp = cp.isRecoveredByDp;
        p.isMissingLyricGap = cp.isMissingLyricGap;
        p.alignmentIssueDetailVi = cp.alignmentIssueDetailVi;
        alignWordsToPhraseNoteBars(
          p,
          noteBars,
          cp.lyricText,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
          undefined,
          cp.autoGenSource === 'phonetic_synth'
        );
      });
    } else {
      // Rebuild phrases from cached LRC/custom phrase boundaries
      const rebuiltCached = cached.phrases.map((cp, idx) => {
        const lineBars = noteBars.filter((b) => {
          const mid = (b.startTimeMs + b.endTimeMs) / 2;
          return mid >= cp.startMs - 80 && mid <= cp.endMs + 80;
        });
        const built = buildPhraseFromBarsAndLyric({
          phraseIndex: idx + 1,
          bars: lineBars,
          fallbackStartMs: cp.startMs,
          fallbackEndMs: cp.endMs,
          lyricText: cp.lyricText,
          isInstrumentalOrVocalize: cp.isInstrumentalOrVocalize,
          allNoteBars: noteBars,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
          preserveSyntheticText: cp.autoGenSource === 'phonetic_synth',
        });
        built.isAutoGeneratedMissing = cp.isAutoGeneratedMissing;
        built.autoGenSource = cp.autoGenSource;
        built.isRecoveredByDp = cp.isRecoveredByDp;
        built.isMissingLyricGap = cp.isMissingLyricGap;
        built.alignmentIssueDetailVi = cp.alignmentIssueDetailVi;
        return built;
      });
      if (rebuiltCached.length > 0) {
        phrases.splice(0, phrases.length, ...rebuiltCached);
      }
    }
    finalizeSections();
    const audit = auditLyricAlignmentHealth(phrases, noteBars);
    const conf = checkConfidence(cached.matchedTrackTitle);
    return {
      lyricSource: cached.lyricSource,
      lyricStatus: audit.status === 'healthy' ? 'complete' : 'partial',
      matchedTrackTitle: cached.matchedTrackTitle,
      candidates,
      candidateConfidence: audit.status === 'mismatch_suspected' ? 'low' : conf.confidence,
      candidateWarning: audit.status === 'mismatch_suspected' ? audit.summaryVi : conf.warning,
      alignmentAudit: audit,
      deepVerification: computeDeepProsody(),
    };
  }

  // 2. Layer 1B: Check Built-in Demo Tracks
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  if (BUILTIN_DEMO_LYRICS[baseName]) {
    const demoLines = BUILTIN_DEMO_LYRICS[baseName];
    alignPlainTextToPhrases(
      phrases,
      noteBars,
      demoLines.join('\n'),
      rawMonoPcm,
      sampleRate,
      pitchTrack,
      precomputedProfiles
    );
    finalizeSections();
    return {
      lyricSource: 'demo_builtin',
      lyricStatus: 'complete',
      matchedTrackTitle: baseName.replace(/_/g, ' '),
      candidates,
      candidateConfidence: 'high',
      deepVerification: computeDeepProsody(),
    };
  }

  // 3. Layer 2: Check Embedded ID3v2 / Vorbis Lyrics inside audio file binary
  const embeddedText = extractEmbeddedLyricsFromBuffer(arrayBuffer);
  if (embeddedText) {
    const lrcLines = parseLrcContent(embeddedText);
    if (lrcLines.length >= 2) {
      alignLrcLinesToPhrases(
        phrases,
        noteBars,
        lrcLines,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
        durationMs,
        precomputedProfiles
      );
    } else {
      alignPlainTextToPhrases(
        phrases,
        noteBars,
        embeddedText,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
        precomputedProfiles
      );
    }
    finalizeSections();
    persistPhrasesToLocalCache({
      fileName,
      durationMs,
      lyricSource: 'embedded_tag',
      phrases,
    });
    return {
      lyricSource: 'embedded_tag',
      lyricStatus: 'complete',
      candidates,
      candidateConfidence: 'high',
      deepVerification: computeDeepProsody(),
    };
  }

  // 4. Layer 3: Query Open LRCLIB API & Built-in Verified Synced LRC Registry
  // Combine filename with embedded ID3v2 Title/Artist ONLY if it doesn't conflict with filename
  const id3Meta = extractEmbeddedMetadataFromBuffer(arrayBuffer);
  let hasId3Conflict = false;
  if (id3Meta.title) {
    const normId3 = normalizeVietnameseSearch(id3Meta.title);
    const id3Tokens = normId3.split(/\s+/).filter((t) => t.length >= 2);
    const overlapTokens = id3Tokens.filter((t) => normFileTokens.includes(t));
    if (id3Tokens.length >= 2 && overlapTokens.length === 0) {
      hasId3Conflict = true;
    }
  }

  const effectiveSearchName = hasId3Conflict
    ? fileName
    : id3Meta.title && !normFile.includes(normalizeVietnameseSearch(id3Meta.title))
      ? `${id3Meta.artist ? `${id3Meta.artist} - ` : ''}${id3Meta.title} - ${fileName}`
      : fileName;

  const autoCloud = await fetchAutoLyricsFromLrclib(effectiveSearchName, durationMs);
  if (autoCloud && (autoCloud.syncedLyrics || autoCloud.plainLyrics)) {
    if (onProgress) {
      onProgress(
        96,
        'Giai đoạn 7/7: Đối chiếu lời bài hát đồng bộ, tách nốt theo âm tiết & định vị cấu trúc đoạn...'
      );
    }
    if (autoCloud.syncedLyrics) {
      const lrcLines = parseLrcContent(autoCloud.syncedLyrics);
      if (lrcLines.length > 0) {
        alignLrcLinesToPhrases(
          phrases,
          noteBars,
          lrcLines,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
          durationMs,
          precomputedProfiles
        );
        finalizeSections();
        let audit = auditLyricAlignmentHealth(phrases, noteBars);
        let chosenTitle = autoCloud.matchedTitle;

        // Auto-Fallback Guard: if primary LRCLIB result is suspected mismatched, test up to 2 backup synced candidates
        if (audit.status === 'mismatch_suspected' && candidates.length > 1) {
          const snapshotPhrases = phrases.map((p) => ({ ...p }));
          const backupCandidates = candidates
            .filter((c) => c.hasSyncedLyrics && c.syncedLyrics && `${c.trackName} – ${c.artistName}` !== chosenTitle)
            .slice(0, 2);

          for (const alt of backupCandidates) {
            const altLines = parseLrcContent(alt.syncedLyrics!);
            if (altLines.length === 0) continue;
            const testPhrases = snapshotPhrases.map((p) => ({ ...p }));
            alignLrcLinesToPhrases(
              testPhrases,
              noteBars,
              altLines,
              rawMonoPcm,
              sampleRate,
              pitchTrack,
              durationMs,
              precomputedProfiles
            );
            const altAudit = auditLyricAlignmentHealth(testPhrases, noteBars);
            if (altAudit.coverageRatio > audit.coverageRatio + 0.12) {
              phrases.splice(0, phrases.length, ...testPhrases);
              finalizeSections();
              audit = auditLyricAlignmentHealth(phrases, noteBars);
              chosenTitle = `${alt.trackName} – ${alt.artistName}`;
              break;
            }
          }
        }

        if (audit.status !== 'mismatch_suspected') {
          persistPhrasesToLocalCache({
            fileName,
            durationMs,
            lyricSource: 'auto_lrclib',
            matchedTrackTitle: chosenTitle,
            phrases,
          });
        }

        const conf = checkConfidence(chosenTitle);
        return {
          lyricSource: 'auto_lrclib',
          lyricStatus: audit.status === 'healthy' ? 'complete' : 'partial',
          matchedTrackTitle: chosenTitle,
          candidates,
          candidateConfidence: audit.status === 'mismatch_suspected' ? 'low' : conf.confidence,
          candidateWarning: audit.status === 'mismatch_suspected' ? audit.summaryVi : conf.warning,
          alignmentAudit: audit,
          deepVerification: computeDeepProsody(),
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
        pitchTrack,
        precomputedProfiles
      );
      finalizeSections();
      const audit = auditLyricAlignmentHealth(phrases, noteBars);
      if (audit.status !== 'mismatch_suspected') {
        persistPhrasesToLocalCache({
          fileName,
          durationMs,
          lyricSource: 'auto_lrclib',
          matchedTrackTitle: autoCloud.matchedTitle,
          phrases,
        });
      }
      const conf = checkConfidence(autoCloud.matchedTitle);
      return {
        lyricSource: 'auto_lrclib',
        lyricStatus: audit.status === 'healthy' ? 'complete' : 'partial',
        matchedTrackTitle: autoCloud.matchedTitle,
        candidates,
        candidateConfidence: conf.confidence,
        candidateWarning: conf.warning,
        alignmentAudit: audit,
        deepVerification: computeDeepProsody(),
      };
    }
  }

  // 5. Layer 4: True Formant (F1/F2) Vowel + Micro-Pitch Trajectory relative representation
  // (Only executed when no lyrics were found in Cache, Builtin, ID3, or LRCLIB)
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
      const pct = Math.min(98, 93 + Math.round(((i + 1) / totalPhrases) * 5));
      onProgress(
        pct,
        `Giai đoạn 7/7: Quét phổ Formant F1-F2 & Quỹ đạo nguyên âm (↗/↘) câu ${i + 1}/${phrases.length}...`
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  finalizeSections();
  return {
    lyricSource: 'acoustic_relative',
    lyricStatus: 'relative_auto',
    candidates,
    candidateConfidence: 'low',
    candidateWarning: 'Chưa tìm thấy bài hát khớp hoàn toàn. Bạn có thể chọn bài từ danh sách gợi ý hoặc dán lời.',
    deepVerification: computeDeepProsody(),
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
        p.singerLabel || '',
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
  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;
  const updatedPhrases = result.phrases.map((p) => {
    if (p.phraseIndex !== phraseIndex) return p;
    const copy: IVocalPhrase = {
      ...p,
      isInstrumentalOrVocalize: isInstrumental,
      isMissingLyricGap: false,
      isAutoGeneratedMissing: false,
      alignmentIssue: null,
      alignmentIssueDetailVi: undefined,
    };
    alignWordsToPhraseNoteBars(
      copy,
      result.noteBars,
      newLyricText,
      rawMonoPcm,
      result.sampleRate,
      result.pitchTrack
    );
    return copy;
  });

  const alignmentAudit = auditLyricAlignmentHealth(updatedPhrases, result.noteBars);
  const updatedResult: IVocalAnalysisResult = {
    ...result,
    lyricSource: 'manual',
    lyricStatus: alignmentAudit.status === 'healthy' ? 'complete' : 'partial',
    alignmentAudit,
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

  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;

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
    rawMonoPcm,
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
  classifyDuetSingerVoices(newPhrases, result.noteBars, result.pitchTrack, result.fileName);
  const alignmentAudit = auditLyricAlignmentHealth(newPhrases, result.noteBars);

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    alignmentAudit,
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

  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;

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
    rawMonoPcm,
    result.sampleRate,
    result.pitchTrack
  );
  alignWordsToPhraseNoteBars(
    rightPhrase,
    result.noteBars,
    rightText,
    rawMonoPcm,
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
  classifyDuetSingerVoices(newPhrases, result.noteBars, result.pitchTrack, result.fileName);
  const alignmentAudit = auditLyricAlignmentHealth(newPhrases, result.noteBars);

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    alignmentAudit,
    phrases: newPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}

/**
 * Interactive Canvas Word-Edge Handle:
 * Drag the boundary between two adjacent NoteBars (`leftBarId` and `rightBarId`) to `newBoundaryMs`
 * and automatically re-synchronize all words in overlapping phrases.
 */
export function adjustAdjacentNoteBarBoundary(
  result: IVocalAnalysisResult,
  leftBarId: string,
  rightBarId: string,
  newBoundaryMs: number
): IVocalAnalysisResult {
  const clonedBars = result.noteBars.map((b) => ({ ...b }));
  const leftIdx = clonedBars.findIndex((b) => b.id === leftBarId);
  const rightIdx = clonedBars.findIndex((b) => b.id === rightBarId);
  if (leftIdx < 0 || rightIdx < 0) return result;

  const leftBar = clonedBars[leftIdx];
  const rightBar = clonedBars[rightIdx];
  const minBoundary = leftBar.startTimeMs + 60;
  const maxBoundary = rightBar.endTimeMs - 60;
  if (minBoundary >= maxBoundary) return result;

  const clampedMs = Math.round(Math.max(minBoundary, Math.min(maxBoundary, newBoundaryMs)));
  leftBar.endTimeMs = Math.max(leftBar.startTimeMs + 50, clampedMs - 4);
  leftBar.durationMs = leftBar.endTimeMs - leftBar.startTimeMs;

  rightBar.startTimeMs = Math.min(rightBar.endTimeMs - 50, clampedMs + 4);
  rightBar.durationMs = rightBar.endTimeMs - rightBar.startTimeMs;

  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;

  const updatedPhrases = result.phrases.map((p) => {
    if (p.endMs < leftBar.startTimeMs - 100 || p.startMs > rightBar.endTimeMs + 100) {
      return p;
    }
    const copy: IVocalPhrase = { ...p };
    const customLyric =
      copy.lyricText && !copy.lyricText.startsWith('Nguyên âm:') ? copy.lyricText : undefined;
    alignWordsToPhraseNoteBars(
      copy,
      clonedBars,
      customLyric,
      rawMonoPcm,
      result.sampleRate,
      result.pitchTrack,
      undefined,
      true
    );
    return copy;
  });

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    noteBars: clonedBars,
    phrases: updatedPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}

/**
 * Interactive Canvas Note Split:
 * Double-clicking inside a NoteBar on `PitchRunwayCanvas` splits that NoteBar at `splitTimeMs`
 * and re-aligns the containing phrase's words onto the newly subdivided bars.
 */
export function splitNoteBarOnCanvas(
  result: IVocalAnalysisResult,
  barId: string,
  splitTimeMs: number
): IVocalAnalysisResult {
  const clonedBars = result.noteBars.map((b) => ({ ...b }));
  const barIdx = clonedBars.findIndex((b) => b.id === barId);
  if (barIdx < 0) return result;

  const targetBar = clonedBars[barIdx];
  if (targetBar.durationMs < 140) return result;

  const clampedSplitMs = Math.round(
    Math.max(
      targetBar.startTimeMs + 60,
      Math.min(targetBar.endTimeMs - 60, splitTimeMs)
    )
  );

  const dummyWorking = [targetBar];
  splitSingleBarAtMs(dummyWorking, clonedBars, 0, clampedSplitMs, result.pitchTrack);

  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;

  const updatedPhrases = result.phrases.map((p) => {
    if (p.endMs < targetBar.startTimeMs - 100 || p.startMs > targetBar.endTimeMs + 100) {
      return p;
    }
    const copy: IVocalPhrase = { ...p };
    const customLyric =
      copy.lyricText && !copy.lyricText.startsWith('Nguyên âm:') ? copy.lyricText : undefined;
    alignWordsToPhraseNoteBars(
      copy,
      clonedBars,
      customLyric,
      rawMonoPcm,
      result.sampleRate,
      result.pitchTrack,
      undefined,
      true
    );
    return copy;
  });

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    noteBars: clonedBars,
    phrases: updatedPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}

/**
 * Interactive Canvas Note Merge:
 * Double-clicking on the boundary handle between two adjacent NoteBars (`leftBarId` and `rightBarId`)
 * merges them into a single sustained/legato NoteBar and re-aligns the containing phrase's words.
 */
export function mergeAdjacentNoteBarsOnCanvas(
  result: IVocalAnalysisResult,
  leftBarId: string,
  rightBarId: string
): IVocalAnalysisResult {
  const clonedBars = result.noteBars.map((b) => ({ ...b }));
  const leftIdx = clonedBars.findIndex((b) => b.id === leftBarId);
  const rightIdx = clonedBars.findIndex((b) => b.id === rightBarId);
  if (leftIdx < 0 || rightIdx < 0 || rightIdx !== leftIdx + 1) return result;

  const leftBar = clonedBars[leftIdx];
  const rightBar = clonedBars[rightIdx];
  const totalDur = Math.max(1, leftBar.durationMs + rightBar.durationMs);
  const weightedExactMidi =
    Math.round(
      ((leftBar.exactMidi * leftBar.durationMs + rightBar.exactMidi * rightBar.durationMs) /
        totalDur) *
        100
    ) / 100;
  const mergedNomMidi = Math.round(weightedExactMidi);
  const info = midiToCompactSolfege(mergedNomMidi);

  const mergedBar: IVocalNoteBar = {
    ...leftBar,
    endTimeMs: rightBar.endTimeMs,
    durationMs: rightBar.endTimeMs - leftBar.startTimeMs,
    midi: mergedNomMidi,
    exactMidi: weightedExactMidi,
    noteName: info.noteName,
    solfegeName: info.solfege.replace(/(\d+)$/, ' $1'),
    avgCentsDiff: Math.round((weightedExactMidi - mergedNomMidi) * 100),
    pointsCount: leftBar.pointsCount + rightBar.pointsCount,
  };

  clonedBars.splice(leftIdx, 2, mergedBar);

  const rawMonoPcm =
    typeof result.audioBuffer?.getChannelData === 'function'
      ? result.audioBuffer.getChannelData(0)
      : null;

  const updatedPhrases = result.phrases.map((p) => {
    if (p.endMs < mergedBar.startTimeMs - 100 || p.startMs > mergedBar.endTimeMs + 100) {
      return p;
    }
    const copy: IVocalPhrase = { ...p };
    const customLyric =
      copy.lyricText && !copy.lyricText.startsWith('Nguyên âm:') ? copy.lyricText : undefined;
    alignWordsToPhraseNoteBars(
      copy,
      clonedBars,
      customLyric,
      rawMonoPcm,
      result.sampleRate,
      result.pitchTrack,
      undefined,
      true
    );
    return copy;
  });

  const updatedResult: IVocalAnalysisResult = {
    ...result,
    noteBars: clonedBars,
    phrases: updatedPhrases,
  };
  saveLyricsToLocalCache(updatedResult);
  return updatedResult;
}
