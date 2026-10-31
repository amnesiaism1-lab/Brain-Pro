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

export type CoreVowelFamily = 'A' | 'E' | 'I' | 'Ơ' | 'Ô' | 'U';

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
  }>;
}

const LYRIC_CACHE_PREFIX = 'brain_vocal_lyric_v8_';
const CLOUD_LRC_CACHE_PREFIX = 'brain_vocal_cloud_lrc_v8_';

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
  // Pre-emphasis removes -12dB/oct glottal slope so F1 and F2 formants are accurately balanced
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
 * Estimate F1 (280-900Hz) and F2 (880-2580Hz) formant peaks for a given audio slice
 * and classify into one of the 6 core Vietnamese vowel regions: 'A', 'E', 'I', 'Ơ', 'Ô', 'U'.
 */
function estimateSliceVowelFormants(
  rawMonoPcm: Float32Array,
  startSample: number,
  endSample: number,
  sampleRate: number,
  fundamentalHz: number
): { vowel: CoreVowelFamily; f1Hz: number; f2Hz: number; nasalRatio: number } {
  const totalLen = endSample - startSample;
  if (totalLen < 128) {
    return { vowel: 'A', f1Hz: 700, f2Hz: 1350, nasalRatio: 0 };
  }

  const winLen = Math.min(1024, totalLen);
  const winStart = startSample + Math.floor((totalLen - winLen) / 2);

  const f1Grid = [280, 340, 400, 470, 540, 620, 710, 800, 900];
  let f1WeightedSum = 0;
  let f1WeightTotal = 0;
  let lowNasalEnergy = 0;

  for (const freq of f1Grid) {
    const distFromF0 = Math.abs(freq - fundamentalHz);
    const f0Mask = distFromF0 < 45 ? 0.35 : 1.0;
    const e = goertzelBandEnergy(rawMonoPcm, winStart, winLen, sampleRate, freq) * f0Mask;
    f1WeightedSum += freq * e;
    f1WeightTotal += e;
    if (freq <= 340) lowNasalEnergy += e;
  }

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

  let vowel: CoreVowelFamily = 'A';

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
  return allNoteBars.filter((b) => {
    const mid = (b.startTimeMs + b.endTimeMs) / 2;
    return mid >= phrase.startMs - 15 && mid <= phrase.endMs + 15;
  });
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
  timeMs: number
): number {
  if (!rawMonoPcm || rawMonoPcm.length < 256 || sampleRate <= 0) return 0;
  const centerSample = Math.round((timeMs / 1000) * sampleRate);
  const winLen = Math.min(768, Math.max(256, Math.round(sampleRate * 0.018)));
  const startSample = Math.max(
    0,
    Math.min(rawMonoPcm.length - winLen, centerSample - Math.floor(winLen / 2))
  );
  if (startSample + winLen > rawMonoPcm.length) return 0;

  const nasalFreqs = [225, 285, 345];
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
  const oralNasalProfile = hasPcm
    ? barPts.map((pt) => computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, pt.timeMs))
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

    const score =
      prominenceDb * 2.4 +
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
  sampleRate = 44100
): IVocalNoteBar[] {
  const workingBars = fuseMicroScoopAndTailBars(phraseBars, allNoteBars, targetWordCount);
  if (workingBars.length === 0 || targetWordCount <= 1) return workingBars;

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

  // Base case w = 0
  const maxFirstEnd = B - W;
  for (let b = 0; b <= maxFirstEnd; b++) {
    dp[0][b] = spanCost(0, 0, b);
    prevSplit[0][b] = 0;
  }

  // Transitions for w = 1 .. W - 1
  for (let w = 1; w < W; w++) {
    const minEnd = w;
    const maxEnd = B - 1 - (W - 1 - w);
    for (let b = minEnd; b <= maxEnd; b++) {
      for (let prevB = w - 1; prevB < b; prevB++) {
        if (dp[w - 1][prevB] === Infinity) continue;
        const candidate = dp[w - 1][prevB] + spanCost(w, prevB + 1, b);
        if (candidate < dp[w][b]) {
          dp[w][b] = candidate;
          prevSplit[w][b] = prevB + 1;
        }
      }
    }
  }

  // Backtrack from (W - 1, B - 1)
  const ranges: Array<{ startBarIdx: number; endBarIdx: number }> = new Array(W);
  let currEnd = B - 1;
  for (let w = W - 1; w >= 0; w--) {
    const start = prevSplit[w][currEnd];
    ranges[w] = { startBarIdx: start, endBarIdx: currEnd };
    currEnd = start - 1;
  }

  return ranges;
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

  const customTokens =
    cleanCustomText.length > 0 ? cleanCustomText.split(/\s+/).filter(Boolean) : [];

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
      sampleRate
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
      rawTokens,
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

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac.solfege,
        noteName: ac.noteName,
        midi: firstBar.midi,
        startMs: firstBar.startTimeMs,
        endMs: lastBar.endTimeMs,
        durationMs: wDur,
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
    const barWordGroups: number[][] = Array.from({ length: phraseBars.length }, () => []);
    rawTokens.forEach((_, i) => {
      const mappedBarIdx = Math.min(
        phraseBars.length - 1,
        Math.floor((i / rawTokens.length) * phraseBars.length)
      );
      barWordGroups[mappedBarIdx].push(i);
    });

    barWordGroups.forEach((tokenIndices, mappedBarIdx) => {
      if (tokenIndices.length === 0) return;
      const bar = phraseBars[mappedBarIdx];
      const ac = barAnalysisList[mappedBarIdx];
      const weights = tokenIndices.map((tIdx) =>
        computeWordIntrinsicDurationWeight(rawTokens[tIdx], tIdx === rawTokens.length - 1)
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
            const valleyScore =
              -pt.volumeDb * 0.8 + (1 - pt.clarity) * 12 - distPenalty;
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

        words.push({
          wordIndex: i,
          text: tk,
          solfege: ac.solfege,
          noteName: ac.noteName,
          midi: bar.midi,
          startMs: wStart,
          endMs: wEnd,
          durationMs: Math.max(40, wEnd - wStart),
          noteSequence: [ac.noteName],
          solfegeSequence: [ac.solfege],
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

  // Post-process word durations to mark sustained notes (`nốt ngân lâu hơn`)
  if (words.length > 0) {
    const sortedWordDurs = words
      .map((w) => w.durationMs || Math.max(50, w.endMs - w.startMs))
      .sort((a, b) => a - b);
    const medianWordDur = sortedWordDurs[Math.floor(sortedWordDurs.length / 2)] || 300;

    words.forEach((w) => {
      const dur = w.durationMs || Math.max(50, w.endMs - w.startMs);
      w.durationMs = dur;
      if (dur >= 600 && (dur >= medianWordDur * 1.35 || dur >= 850)) {
        w.isSustained = true;
        w.sustainLabel = `Ngân ${(dur / 1000).toFixed(1)}s`;
      }
    });
  }

  phrase.words = words;
}

/**
 * Parse LRC formatted text (`[mm:ss.xx] Lyric line`) into timestamped lines,
 * automatically filtering out non-sung metadata/credit lines (`[ar:...]`, `Ca sĩ:`, `Sáng tác:`).
 */
export function parseLrcContent(lrcText: string): ILrcLine[] {
  const lines = lrcText.split(/\r?\n/);
  const result: ILrcLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const inlineWordRegex = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>\s*([^<]+)/g;

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
        const wTimeMs = wMin * 60000 + wSec * 1000 + wMs;
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

    if (!textContent) continue;

    // Skip LRC credit/header lines often placed at 00:00..00:05 (e.g. "Bài hát:", "Ca sĩ:", "Nhạc sĩ:", "LRC by")
    if (
      /^(?:bài hát|ca sĩ|sáng tác|nhạc sĩ|lời bài hát|lyric by|synced by|biểu diễn|tác giả)\s*[:\-]/i.test(
        textContent
      )
    ) {
      continue;
    }

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
      result.push({
        timeMs,
        text: textContent,
        ...(parsedWordTimestamps && parsedWordTimestamps.length > 0
          ? { wordTimestamps: parsedWordTimestamps }
          : {}),
      });
    }
  }

  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
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
  audioDurationMs?: number
): number {
  if (phrases.length === 0 || lrcLines.length === 0) return 0;

  // Collect phrase start times and post-pause noteBar onset times
  const vocalOnsets: number[] = phrases.map((p) => p.startMs);
  for (let i = 1; i < noteBars.length; i++) {
    if (noteBars[i].startTimeMs - noteBars[i - 1].endTimeMs >= 200) {
      vocalOnsets.push(noteBars[i].startTimeMs);
    }
  }

  const lastAudioMs = Math.max(
    audioDurationMs || 0,
    phrases[phrases.length - 1]?.endMs || 0,
    noteBars[noteBars.length - 1]?.endTimeMs || 0
  );
  const lastLrcMs = lrcLines[lrcLines.length - 1].timeMs;

  // Determine if the audio file covers the full song timeline (or has a standard instrumental intro).
  // On full songs with accompaniment/beat (e.g. Cơn Mưa Tình Yêu with a 34s intro),
  // accompaniment instruments create noteBars during 00:00..00:34.
  // Allowing a large negative offset would shift LRC lines onto the instrumental intro!
  const isFullTimelineTrack =
    lastAudioMs >= lastLrcMs - 15000 || lrcLines[0].timeMs >= 8000;

  const candidateOffsets = new Set<number>([0]);
  if (isFullTimelineTrack) {
    // Strictly fine-tune within [-800ms .. +800ms] to never jump across phrases or intros
    for (let delta = -800; delta <= 800; delta += 100) {
      candidateOffsets.add(delta);
    }
  } else {
    // Trimmed clip/stem where the audio file is much shorter than the full LRC timeline
    const firstDiff = phrases[0].startMs - lrcLines[0].timeMs;
    if (Math.abs(firstDiff) <= 25000) {
      candidateOffsets.add(Math.round(firstDiff / 50) * 50);
    }
    for (let delta = -4000; delta <= 4000; delta += 200) {
      candidateOffsets.add(delta);
    }
  }

  let bestOffset = 0;
  let bestScore = -Infinity;
  const zeroPenaltyWeight = isFullTimelineTrack ? 0.045 : 0.004;

  for (const offset of candidateOffsets) {
    let score = -Math.abs(offset) * zeroPenaltyWeight;

    for (let i = 0; i < lrcLines.length; i++) {
      const shiftedStart = lrcLines[i].timeMs + offset;
      const shiftedEnd =
        i + 1 < lrcLines.length
          ? Math.min(lrcLines[i + 1].timeMs + offset, shiftedStart + 5000)
          : shiftedStart + 4500;

      // 1. Proximity of shiftedStart to nearest vocal onset
      let minOnsetDist = Infinity;
      for (const onset of vocalOnsets) {
        const d = Math.abs(onset - shiftedStart);
        if (d < minOnsetDist) minOnsetDist = d;
      }
      if (minOnsetDist <= 900) {
        score += (900 - minOnsetDist) * 0.025;
      }

      // 2. Check if this LRC window covers actual sung noteBars
      const hasBars = noteBars.some((b) => {
        const mid = (b.startTimeMs + b.endTimeMs) / 2;
        return mid >= shiftedStart - 120 && mid <= shiftedEnd + 120;
      });
      if (hasBars) {
        score += 10;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return bestOffset;
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
      const beyondReasonableSungWindow = elapsedMs > maxSungSpanMs && gap >= 260;

      if (enoughForAllWords || enoughForMostWords || beyondReasonableSungWindow) {
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
    wordTimestamps
  );

  return phrase;
}

/**
 * Align parsed LRC lines onto IVocalPhrase[] using:
 * 1. Global Audio-to-LRC Time Offset Auto-Calibration
 * 2. Breath-Snapped LRC Boundary Partitioning (each LRC line becomes 1 clean phrase,
 *    never gluing two lyric lines together and never letting words bleed into adjacent phrases!)
 */
export function alignLrcLinesToPhrases(
  phrases: IVocalPhrase[],
  noteBars: IVocalNoteBar[],
  lrcLines: ILrcLine[],
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100,
  pitchTrack: IReferencePitchPoint[] = [],
  audioDurationMs?: number
): void {
  if (phrases.length === 0 || lrcLines.length === 0) return;

  const optimalOffsetMs = estimateOptimalLrcOffsetMs(
    phrases,
    noteBars,
    lrcLines,
    audioDurationMs
  );
  const shiftedLines = lrcLines.map((l) => ({
    timeMs: Math.max(0, l.timeMs + optimalOffsetMs),
    text: l.text,
    wordTimestamps: l.wordTimestamps?.map((wt) => ({
      timeMs: Math.max(0, wt.timeMs + optimalOffsetMs),
      text: wt.text,
    })),
  }));

  // Compute breath-snapped boundary timestamps B[0..L] between consecutive LRC lines
  // Snaps each LRC line transition to the clearest inter-note silence gap within ±650ms
  const L = shiftedLines.length;
  const boundaries: number[] = new Array(L + 1);
  boundaries[0] = Math.max(0, shiftedLines[0].timeMs - 300);

  for (let i = 1; i < L; i++) {
    const nominalMs = shiftedLines[i].timeMs;
    const minWindow = Math.max(
      shiftedLines[i - 1].timeMs + 250,
      nominalMs - 650
    );
    const maxWindow =
      i + 1 < L
        ? Math.min(shiftedLines[i + 1].timeMs - 250, nominalMs + 650)
        : nominalMs + 650;

    let bestBoundaryMs = nominalMs;
    let bestGapScore = -Infinity;

    for (let k = 0; k < noteBars.length - 1; k++) {
      const gapStart = noteBars[k].endTimeMs;
      const gapEnd = noteBars[k + 1].startTimeMs;
      const gapMid = Math.round((gapStart + gapEnd) / 2);
      if (gapMid < minWindow || gapMid > maxWindow) continue;

      const gapDur = gapEnd - gapStart;
      const distPenalty = Math.abs(gapMid - nominalMs) * 0.22;
      const gapScore = gapDur - distPenalty;
      if (gapScore > bestGapScore) {
        bestGapScore = gapScore;
        bestBoundaryMs = gapMid;
      }
    }

    boundaries[i] = bestBoundaryMs;
  }

  const lastBarEnd =
    noteBars.length > 0 ? noteBars[noteBars.length - 1].endTimeMs + 500 : shiftedLines[L - 1].timeMs + 5000;
  boundaries[L] = Math.max(lastBarEnd, shiftedLines[L - 1].timeMs + 4000);

  // If phrase count already matches LRC line count 1-to-1 (e.g. unit tests or pre-segmented tracks),
  // update each phrase in-place with its exact 1-to-1 LRC line and snapped noteBars!
  if (phrases.length === L) {
    phrases.forEach((p, i) => {
      const bStart = boundaries[i];
      const wordCount = Math.max(
        1,
        shiftedLines[i].text.trim().split(/\s+/).filter(Boolean).length
      );
      const maxSungWindowEnd =
        shiftedLines[i].timeMs + Math.max(3200, wordCount * 680 + 1800);
      const bEnd = Math.min(boundaries[i + 1], maxSungWindowEnd);
      const lineBars = noteBars.filter((b) => {
        const mid = (b.startTimeMs + b.endTimeMs) / 2;
        return mid >= bStart && mid < bEnd;
      });
      if (lineBars.length > 0) {
        p.startMs = lineBars[0].startTimeMs;
        p.endMs = lineBars[lineBars.length - 1].endTimeMs;
        p.durationMs = Math.max(200, p.endMs - p.startMs);
      }
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(
        p,
        noteBars,
        shiftedLines[i].text,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
        shiftedLines[i].wordTimestamps
      );
    });
    return;
  }

  // Otherwise, rebuild the phrases array directly from the breath-snapped LRC windows
  // so every sung lyric sentence is a clean 1-to-1 phrase with zero cross-phrase lyric bleeding!
  // Note: We do NOT create fake phrases for instrumental intros before boundaries[0] so that
  // Câu 1 always starts at the first real LRC line even on full-beat tracks!
  const rebuiltPhrases: IVocalPhrase[] = [];
  let nextIdx = 1;

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

    const lineBars = noteBars.filter((b) => {
      const mid = (b.startTimeMs + b.endTimeMs) / 2;
      return mid >= bStart && mid < bEnd;
    });

    // Skip LRC lines that fall completely past the end of the audio file (e.g. Part_1 cut)
    if (lineBars.length === 0 && bStart > maxAudioMs) {
      continue;
    }

    rebuiltPhrases.push(
      buildPhraseFromBarsAndLyric({
        phraseIndex: nextIdx++,
        bars: lineBars,
        fallbackStartMs: shiftedLines[i].timeMs,
        fallbackEndMs: Math.min(bEnd, shiftedLines[i].timeMs + 3800),
        lyricText: shiftedLines[i].text,
        isInstrumentalOrVocalize: false,
        allNoteBars: noteBars,
        rawMonoPcm,
        sampleRate,
        pitchTrack,
        wordTimestamps: shiftedLines[i].wordTimestamps,
      })
    );
  }

  if (rebuiltPhrases.length > 0) {
    phrases.splice(0, phrases.length, ...rebuiltPhrases);
  }
}

/**
 * Align plain multi-line text onto IVocalPhrase[] without gluing unrelated sentences together
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

  // If plainText has fewer lines than acoustic phrases, check if some acoustic phrases
  // were split by short (< 420ms) pauses and merge them down toward cleanLines.length
  while (phrases.length > cleanLines.length && phrases.length >= 2) {
    let minGap = Infinity;
    let mergeIdx = -1;
    for (let i = 0; i < phrases.length - 1; i++) {
      const gap = phrases[i + 1].startMs - phrases[i].endMs;
      const combinedDur = phrases[i + 1].endMs - phrases[i].startMs;
      if (gap < minGap && gap <= 480 && combinedDur <= 6500) {
        minGap = gap;
        mergeIdx = i;
      }
    }
    if (mergeIdx < 0) break;
    const first = phrases[mergeIdx];
    const second = phrases[mergeIdx + 1];
    first.endMs = second.endMs;
    first.durationMs = second.endMs - first.startMs;
    first.notes = Array.from(new Set([...first.notes, ...second.notes])).slice(0, 8);
    first.pointsCount += second.pointsCount;
    phrases.splice(mergeIdx + 1, 1);
    phrases.forEach((p, idx) => {
      p.id = `phrase-${idx + 1}`;
      p.phraseIndex = idx + 1;
    });
  }

  phrases.forEach((p, idx) => {
    if (idx < cleanLines.length) {
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(
        p,
        noteBars,
        cleanLines[idx],
        rawMonoPcm,
        sampleRate,
        pitchTrack
      );
    } else {
      p.isInstrumentalOrVocalize = true;
      alignWordsToPhraseNoteBars(p, noteBars, undefined, rawMonoPcm, sampleRate, pitchTrack);
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

  // 1. Primary part with featuring artist removed
  const beforeFeat = primaryPart.split(/\b(?:ft\.?|feat\.?)\b/i)[0] || primaryPart;
  addCandidateWithVariants(beforeFeat);

  // 2. Clean individual dash-separated segments (supports both "Title - Artist" and "Artist - Title - Part_1")
  const dashParts = beforeFeat
    .split(/\s*-\s*/)
    .map((p) => stripNoise(p))
    .filter((p) => p.length >= 3);

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
export async function fetchAutoLyricsFromLrclib(
  fileName: string,
  durationMs: number
): Promise<{ syncedLyrics?: string; plainLyrics?: string; matchedTitle?: string } | null> {
  // 1. Check Built-in Verified Synced LRC Registry first
  const builtinSynced = findBuiltinVerifiedSyncedLrc(fileName);
  if (builtinSynced) {
    return builtinSynced;
  }

  const queries = buildSmartLyricQueries(fileName);
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
    return hasRealLyric ? parsed : null;
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

  const finalizeSections = () => {
    classifyPhraseSectionsAndContours(phrases, noteBars, durationMs, lowestMidi, highestMidi);
    classifyDuetSingerVoices(phrases, noteBars, pitchTrack, fileName);
  };

  if (onProgress) {
    onProgress(
      92,
      'Giai đoạn 6/7: Đang truy vấn lời bài hát đồng bộ (LRC) & chuẩn hóa câu hát...'
    );
  }

  // 1. Layer 1A: Check LocalStorage user/cloud cache first
  const cached = loadLyricsFromLocalCache(fileName, durationMs);
  if (cached) {
    if (cached.phrases.length === phrases.length) {
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
    } else {
      // Rebuild phrases from cached LRC/custom phrase boundaries
      const rebuiltCached = cached.phrases.map((cp, idx) => {
        const lineBars = noteBars.filter((b) => {
          const mid = (b.startTimeMs + b.endTimeMs) / 2;
          return mid >= cp.startMs - 80 && mid <= cp.endMs + 80;
        });
        return buildPhraseFromBarsAndLyric({
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
        });
      });
      if (rebuiltCached.length > 0) {
        phrases.splice(0, phrases.length, ...rebuiltCached);
      }
    }
    finalizeSections();
    return {
      lyricSource: cached.lyricSource,
      lyricStatus: 'complete',
      matchedTrackTitle: cached.matchedTrackTitle,
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
      pitchTrack
    );
    finalizeSections();
    return {
      lyricSource: 'demo_builtin',
      lyricStatus: 'complete',
      matchedTrackTitle: baseName.replace(/_/g, ' '),
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
        durationMs
      );
    } else {
      alignPlainTextToPhrases(phrases, noteBars, embeddedText, rawMonoPcm, sampleRate, pitchTrack);
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
    };
  }

  // 4. Layer 3: Query Open LRCLIB API & Built-in Verified Synced LRC Registry
  // Combine filename with any embedded ID3v2 Title/Artist metadata for maximum coverage
  const id3Meta = extractEmbeddedMetadataFromBuffer(arrayBuffer);
  const effectiveSearchName =
    id3Meta.title && !normalizeVietnameseSearch(fileName).includes(normalizeVietnameseSearch(id3Meta.title))
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
          durationMs
        );
        finalizeSections();
        persistPhrasesToLocalCache({
          fileName,
          durationMs,
          lyricSource: 'auto_lrclib',
          matchedTrackTitle: autoCloud.matchedTitle,
          phrases,
        });
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
      finalizeSections();
      persistPhrasesToLocalCache({
        fileName,
        durationMs,
        lyricSource: 'auto_lrclib',
        matchedTrackTitle: autoCloud.matchedTitle,
        phrases,
      });
      return {
        lyricSource: 'auto_lrclib',
        lyricStatus: 'complete',
        matchedTrackTitle: autoCloud.matchedTitle,
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

  const updatedResult: IVocalAnalysisResult = {
    ...result,
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
