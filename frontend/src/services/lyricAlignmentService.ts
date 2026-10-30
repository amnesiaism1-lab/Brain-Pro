/**
 * Lyric Extraction, Alignment & Structural Landmark Service (lyricAlignmentService.ts)
 *
 * Provides a 5-layer automatic lyric & structural section analysis pipeline during vocal audio analysis:
 * 1. Local user cache (`localStorage`) & Built-in Demo Track exact lyrics
 * 2. Embedded binary audio metadata (ID3v2 USLT/SYLT & Vorbis/FLAC LYRICS tags)
 * 3. Automatic cloud LRC lookup via open LRCLIB API (with fast 2.2s non-blocking timeout)
 * 4. Offline Acoustic Formant (F1/F2 Vowel Mouth-Shape) & Solfege Syllable synthesis + Song Section Landmarking
 * 5. Interactive LRC/Plain-text alignment, inline phrase lyric editing, phrase split/merge, and accent-insensitive search/trace
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

export type LyricDisplayMode = 'lyrics' | 'solfege' | 'bilingual';

export type VowelMouthHint =
  | 'A (Mở rộng)'
  | 'Ơ/Ê (Mở vừa)'
  | 'I/U (Khép môi)'
  | 'Ô/O (Tròn môi)'
  | 'Ngân (Cộng minh)';

export interface IVocalLyricWord {
  wordIndex: number;
  text: string;
  solfege: string;
  noteName: string;
  midi: number;
  startMs: number;
  endMs: number;
  vowelHint?: VowelMouthHint;
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

const LYRIC_CACHE_PREFIX = 'brain_vocal_lyric_v1_';

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
export function midiToCompactSolfege(midi: number): { noteName: string; solfege: string; pureSolfege: string } {
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
 * Analyze raw PCM audio slice for a single NoteBar to estimate mouth shape (vowel formant F1/F2)
 * and synthesize a natural relative singing syllable when real lyrics are unavailable.
 */
export function analyzeNoteBarAcousticSyllable(
  rawMonoPcm: Float32Array | null,
  sampleRate: number,
  bar: IVocalNoteBar,
  barIndexInPhrase: number
): { syllable: string; vowelHint: VowelMouthHint } {
  const { pureSolfege } = midiToCompactSolfege(bar.midi);

  if (!rawMonoPcm || rawMonoPcm.length === 0 || sampleRate <= 0) {
    return { syllable: pureSolfege, vowelHint: 'A (Mở rộng)' };
  }

  const startSample = Math.max(0, Math.floor((bar.startTimeMs / 1000) * sampleRate));
  const endSample = Math.min(rawMonoPcm.length, Math.ceil((bar.endTimeMs / 1000) * sampleRate));
  const len = endSample - startSample;

  if (len < 128) {
    return { syllable: pureSolfege, vowelHint: 'Ơ/Ê (Mở vừa)' };
  }

  // Compute Zero-Crossing Rate (ZCR), First-Difference Energy (High-frequency F2 proxy), and RMS
  let zeroCrossings = 0;
  let totalEnergy = 0;
  let diffEnergy = 0;
  let onsetEnergy = 0;
  const onsetLen = Math.min(len, Math.floor(sampleRate * 0.045)); // first 45ms consonant attack

  for (let i = startSample + 1; i < endSample; i++) {
    const curr = rawMonoPcm[i];
    const prev = rawMonoPcm[i - 1];
    if ((curr >= 0 && prev < 0) || (curr < 0 && prev >= 0)) {
      zeroCrossings++;
    }
    totalEnergy += curr * curr;
    const d = curr - prev;
    diffEnergy += d * d;
    if (i - startSample < onsetLen) {
      onsetEnergy += d * d;
    }
  }

  const zcrHz = (zeroCrossings / len) * (sampleRate / 2);
  const hfRatio = totalEnergy > 0 ? Math.sqrt(diffEnergy / totalEnergy) : 0.2;
  const onsetSharpness = onsetLen > 0 && diffEnergy > 0 ? (onsetEnergy / onsetLen) / (diffEnergy / len) : 1.0;

  // Determine initial consonant feel from onset sharpness
  const hasPlosiveOnset = onsetSharpness > 1.55;
  const isFirstInPhrase = barIndexInPhrase === 0;

  // Classify vowel mouth shape from spectral centroid / ZCR & HF ratio
  if (bar.durationMs >= 950 && hfRatio < 0.16) {
    return {
      syllable: isFirstInPhrase ? 'Ngân' : 'Ờm',
      vowelHint: 'Ngân (Cộng minh)',
    };
  }

  if (zcrHz > 1100 || hfRatio > 0.34) {
    // High F2 front vowel (I / Ê)
    const frontSyllables = hasPlosiveOnset ? ['Đì', 'Tí', 'Mình', 'Khi'] : ['Yêu', 'Mi', 'Đi', 'Rì'];
    return {
      syllable: frontSyllables[barIndexInPhrase % frontSyllables.length],
      vowelHint: 'I/U (Khép môi)',
    };
  }

  if (zcrHz > 720 || hfRatio > 0.24) {
    // Open bright vowel (A / Ă)
    const openSyllables = hasPlosiveOnset ? ['Ta', 'Đa', 'Ca', 'Xa'] : ['La', 'Hà', 'Vang', 'Ngân'];
    return {
      syllable: openSyllables[barIndexInPhrase % openSyllables.length],
      vowelHint: 'A (Mở rộng)',
    };
  }

  if (zcrHz > 460 || hfRatio > 0.17) {
    // Mid central vowel (Ơ / Ê)
    const midSyllables = hasPlosiveOnset ? ['Đời', 'Tơ', 'Nơi', 'Mơ'] : ['Ơi', 'Mơ', 'Về', 'Êm'];
    return {
      syllable: midSyllables[barIndexInPhrase % midSyllables.length],
      vowelHint: 'Ơ/Ê (Mở vừa)',
    };
  }

  // Low back rounded vowel (Ô / O / U)
  const roundSyllables = hasPlosiveOnset ? ['Đô', 'Có', 'Gió', 'Ru'] : ['Ồ', 'Ru', 'Du', 'Hò'];
  return {
    syllable: roundSyllables[barIndexInPhrase % roundSyllables.length],
    vowelHint: 'Ô/O (Tròn môi)',
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

  // Find phrase with highest average pitch and peak note for climax/chorus detection
  let maxAvgMidi = -999;
  let climaxPhraseIdx = -1;
  phrases.forEach((p) => {
    if (p.avgMidi > maxAvgMidi) {
      maxAvgMidi = p.avgMidi;
      climaxPhraseIdx = p.phraseIndex;
    }
  });

  phrases.forEach((phrase, idx) => {
    const progressRatio = durationMs > 0 ? phrase.startMs / durationMs : idx / Math.max(1, phrases.length);
    const relativeHeight = (phrase.avgMidi - lowestMidi) / midiSpan;
    const phraseBars = noteBars.filter(
      (b) => b.endTimeMs >= phrase.startMs && b.startTimeMs <= phrase.endMs
    );

    // Determine melodic contour direction (First bar vs Last bar)
    let contourLabel = 'Giữ trục cao độ ổn định →';
    if (phraseBars.length >= 2) {
      const delta = phraseBars[phraseBars.length - 1].midi - phraseBars[0].midi;
      if (phrase.pitchJumpSemitones >= 6) {
        contourLabel = `Nhảy quãng rộng (${phrase.pitchJumpSemitones} bán âm) ⚡`;
      } else if (delta >= 2.5) {
        contourLabel = 'Giai điệu vươn cao dần ↗';
      } else if (delta <= -2.5) {
        contourLabel = 'Giai điệu lướt trầm xuống ↘';
      } else {
        contourLabel = 'Luyến ngang nhịp nhàng ↔';
      }
    }

    // Determine Structural Section Type & Label
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

    // Generate tailored focusTip
    let focusTip = 'Giữ cột hơi đều, phát âm rõ chữ và bám sát đường tâm nốt nhạc.';
    if (sectionType === 'climax' || sectionType === 'chorus') {
      focusTip = `Đoạn cao trào (${phrase.lowestNote} → ${phrase.highestNote}): Mở rộng vòm họng, hạ hàm dưới và nén hơi cơ hoành để lên nốt ${phrase.highestNote} không bị gắt.`;
    } else if (phrase.pitchJumpSemitones >= 5) {
      focusTip = `Có bước nhảy quãng ${phrase.pitchJumpSemitones} bán âm: Nghe kỹ nốt đích và chuyển thanh quản mượt, tránh trượt giọng (scooping).`;
    } else if (sectionType === 'outro') {
      focusTip = 'Đoạn kết: Giữ hơi thở sâu để ngân nốt cuối tròn trịa, không bị tụt cao độ (flat) khi hết hơi.';
    }

    phrase.sectionType = sectionType;
    phrase.sectionLabel = sectionLabel;
    phrase.contourLabel = contourLabel;
    phrase.focusTip = focusTip;
  });
}

/**
 * Align a lyric string (words/syllables) onto the discrete NoteBars belonging to a Phrase.
 * Also populates `solfegeText`, `acousticText`, and `words: IVocalLyricWord[]`.
 */
export function alignWordsToPhraseNoteBars(
  phrase: IVocalPhrase,
  allNoteBars: IVocalNoteBar[],
  lyricText?: string,
  rawMonoPcm?: Float32Array | null,
  sampleRate = 44100
): void {
  const phraseBars = allNoteBars.filter(
    (b) => b.endTimeMs >= phrase.startMs - 40 && b.startTimeMs <= phrase.endMs + 40
  );

  // Build Solfege & Acoustic representations from phraseBars
  const solfegeTokens: string[] = [];
  const acousticTokens: string[] = [];
  const barAcoustics: Array<{ syllable: string; vowelHint: VowelMouthHint; solfege: string; noteName: string }> = [];

  if (phraseBars.length > 0) {
    phraseBars.forEach((bar, idx) => {
      const { noteName, solfege } = midiToCompactSolfege(bar.midi);
      const ac = analyzeNoteBarAcousticSyllable(rawMonoPcm || null, sampleRate, bar, idx);
      solfegeTokens.push(solfege);
      acousticTokens.push(ac.syllable);
      barAcoustics.push({
        syllable: ac.syllable,
        vowelHint: ac.vowelHint,
        solfege,
        noteName,
      });
    });
  } else {
    // Fallback if phrase has no discrete noteBar
    phrase.notes.forEach((n, idx) => {
      solfegeTokens.push(n);
      acousticTokens.push(idx % 2 === 0 ? 'La' : 'Ơi');
    });
  }

  phrase.solfegeText = solfegeTokens.join(' · ');
  const contourShort = phrase.lowestNote === phrase.highestNote
    ? phrase.lowestNote
    : `${phrase.lowestNote}→${phrase.highestNote}`;
  phrase.acousticText = `${acousticTokens.join(' ')} (${contourShort})`;

  // Determine effective lyric text
  const cleanCustomText = lyricText?.trim();
  const effectiveText = cleanCustomText && cleanCustomText.length > 0
    ? cleanCustomText
    : phrase.isInstrumentalOrVocalize
      ? '🎵 Đoạn ngân / Không lời (Vocalize)'
      : phrase.acousticText;

  phrase.lyricText = effectiveText;

  // Tokenize words/syllables for word-level Karaoke synchronization
  const rawTokens = cleanCustomText
    ? cleanCustomText.split(/\s+/).filter(Boolean)
    : acousticTokens.length > 0
      ? acousticTokens
      : ['La', 'Ơi'];

  const words: IVocalLyricWord[] = [];

  if (phraseBars.length === 0) {
    // Evenly distribute tokens across [phrase.startMs, phrase.endMs]
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
        vowelHint: 'A (Mở rộng)',
      });
    });
  } else if (rawTokens.length <= phraseBars.length) {
    // Map each word token to one or more noteBars (handles melisma / luyến nhiều nốt trên 1 chữ)
    const barsPerWord = phraseBars.length / rawTokens.length;
    rawTokens.forEach((tk, i) => {
      const startBarIdx = Math.min(phraseBars.length - 1, Math.floor(i * barsPerWord));
      const endBarIdx = Math.min(
        phraseBars.length - 1,
        Math.max(startBarIdx, Math.floor((i + 1) * barsPerWord) - 1)
      );
      const firstBar = phraseBars[startBarIdx];
      const lastBar = phraseBars[endBarIdx];
      const ac = barAcoustics[startBarIdx];

      // Attach syllable onto the noteBars for direct Canvas rendering!
      firstBar.lyricSyllable = tk;
      firstBar.vowelHint = ac?.vowelHint;
      for (let bIdx = startBarIdx + 1; bIdx <= endBarIdx; bIdx++) {
        phraseBars[bIdx].lyricSyllable = `~${tk}`;
        phraseBars[bIdx].vowelHint = barAcoustics[bIdx]?.vowelHint;
      }

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac ? ac.solfege : firstBar.solfegeName,
        noteName: ac ? ac.noteName : firstBar.noteName,
        midi: firstBar.midi,
        startMs: firstBar.startTimeMs,
        endMs: lastBar.endTimeMs,
        vowelHint: ac?.vowelHint,
      });
    });
  } else {
    // More words than noteBars (e.g. rapid syllables on a single sustained pitch)
    rawTokens.forEach((tk, i) => {
      const mappedBarIdx = Math.min(
        phraseBars.length - 1,
        Math.floor((i / rawTokens.length) * phraseBars.length)
      );
      const bar = phraseBars[mappedBarIdx];
      const ac = barAcoustics[mappedBarIdx];

      // Find all tokens mapped to this same bar to subdivide its duration proportionally
      const firstTokenForBar = Math.floor((mappedBarIdx / phraseBars.length) * rawTokens.length);
      const lastTokenForBar = Math.max(
        firstTokenForBar,
        Math.ceil(((mappedBarIdx + 1) / phraseBars.length) * rawTokens.length) - 1
      );
      const countInBar = Math.max(1, lastTokenForBar - firstTokenForBar + 1);
      const subIndex = Math.max(0, i - firstTokenForBar);
      const subDur = bar.durationMs / countInBar;

      if (subIndex === 0) {
        bar.lyricSyllable = tk;
        bar.vowelHint = ac?.vowelHint;
      } else if (bar.lyricSyllable && !bar.lyricSyllable.includes(' ')) {
        bar.lyricSyllable = `${bar.lyricSyllable} ${tk}`;
      }

      words.push({
        wordIndex: i,
        text: tk,
        solfege: ac ? ac.solfege : bar.solfegeName,
        noteName: ac ? ac.noteName : bar.noteName,
        midi: bar.midi,
        startMs: Math.round(bar.startTimeMs + subIndex * subDur),
        endMs: Math.round(bar.startTimeMs + (subIndex + 1) * subDur),
        vowelHint: ac?.vowelHint,
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
      .replace(/<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g, '') // strip enhanced word timestamps if present
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
  sampleRate = 44100
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

    // Find phrase with best temporal overlap or closest center
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
      sampleRate
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
  sampleRate = 44100
): void {
  const cleanLines = plainText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[(verse|chorus|intro|outro|bridge|điệp khúc|phiên khúc)/i.test(l));

  if (cleanLines.length === 0 || phrases.length === 0) return;

  if (cleanLines.length === phrases.length) {
    phrases.forEach((p, idx) => {
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(p, noteBars, cleanLines[idx], rawMonoPcm, sampleRate);
    });
    return;
  }

  // Distribute lines proportionally across phrases
  phrases.forEach((p, idx) => {
    if (cleanLines.length < phrases.length) {
      const lineText = cleanLines[idx];
      p.isInstrumentalOrVocalize = !lineText;
      alignWordsToPhraseNoteBars(p, noteBars, lineText, rawMonoPcm, sampleRate);
    } else {
      const startL = Math.floor((idx / phrases.length) * cleanLines.length);
      const endL = Math.max(startL + 1, Math.floor(((idx + 1) / phrases.length) * cleanLines.length));
      const combined = cleanLines.slice(startL, endL).join(' ');
      p.isInstrumentalOrVocalize = false;
      alignWordsToPhraseNoteBars(p, noteBars, combined, rawMonoPcm, sampleRate);
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

    // 1. Check Vorbis / FLAC / APEv2 comment tag: "LYRICS=" or "UNSYNCEDLYRICS="
    const vorbisMatch = headerAscii.match(/(?:UNSYNCED)?LYRICS=([^\x00]{12,4000})/i);
    if (vorbisMatch && vorbisMatch[1]) {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
      const startIdx = headerAscii.indexOf(vorbisMatch[1]);
      if (startIdx >= 0) {
        const sub = bytes.subarray(startIdx, startIdx + vorbisMatch[1].length);
        return utf8Decoder.decode(sub).trim();
      }
    }

    // 2. Check ID3v2 "USLT" frame
    const usltIdx = headerAscii.indexOf('USLT');
    if (usltIdx >= 0 && usltIdx + 14 < bytes.length) {
      const frameSize =
        (bytes[usltIdx + 4] << 24) |
        (bytes[usltIdx + 5] << 16) |
        (bytes[usltIdx + 6] << 8) |
        bytes[usltIdx + 7];
      if (frameSize > 6 && frameSize < 32768 && usltIdx + 10 + frameSize <= bytes.length) {
        const encoding = bytes[usltIdx + 10];
        // Skip 1 byte encoding + 3 bytes language ('eng'/'vie') + content descriptor
        let textStart = usltIdx + 14;
        while (textStart < usltIdx + 10 + frameSize && bytes[textStart] !== 0) {
          textStart++;
        }
        textStart++; // skip null terminator
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
 * Clean a file name to form a search query for LRCLIB automatic lyric lookup
 */
export function cleanFileNameForLyricSearch(fileName: string): string | null {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/\b(vocal|stem|acapella|karaoke|official|audio|mv|hd|mp3|wav|128kbps|320kbps|demo|track|record|recording|ghi_am)\b/gi, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Do not query generic filenames
  if (cleaned.length < 3 || /^(audio|vocal|bai hat|test|sample|untitled|\d+)$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Query open LRCLIB API (`https://lrclib.net/api/search`) with a fast 2.2s timeout
 */
export async function fetchAutoLyricsFromLrclib(
  fileName: string,
  durationMs: number
): Promise<{ syncedLyrics?: string; plainLyrics?: string; matchedTitle?: string } | null> {
  const query = cleanFileNameForLyricSearch(fileName);
  if (!query || typeof fetch === 'undefined') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2200);

  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;

    const targetDurSec = durationMs / 1000;
    // Sort by closeness to audio duration while preferring syncedLyrics
    const scored = list
      .filter((item: any) => item && (item.syncedLyrics || item.plainLyrics))
      .map((item: any) => {
        const durDiff = Math.abs((Number(item.duration) || targetDurSec) - targetDurSec);
        const hasSyncBonus = item.syncedLyrics ? 25 : 0;
        return { item, score: hasSyncBonus - durDiff };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;
    const best = scored[0].item;
    return {
      syncedLyrics: best.syncedLyrics || undefined,
      plainLyrics: best.plainLyrics || undefined,
      matchedTitle: [best.trackName, best.artistName].filter(Boolean).join(' – '),
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
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
 * Populates structural sections, contours, acoustic syllables, and exact/auto lyrics for all phrases!
 */
export async function populateAutomaticSongLyricsAndStructure(params: {
  fileName: string;
  durationMs: number;
  sampleRate: number;
  rawMonoPcm: Float32Array;
  arrayBuffer: ArrayBuffer;
  phrases: IVocalPhrase[];
  noteBars: IVocalNoteBar[];
  lowestMidi: number;
  highestMidi: number;
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
    lowestMidi,
    highestMidi,
  } = params;

  // 1. Always classify structural sections (Intro, Verse, Chorus, Climax, Outro) & contours first
  classifyPhraseSectionsAndContours(phrases, noteBars, durationMs, lowestMidi, highestMidi);

  // 2. Always compute baseline Acoustic Formant Syllables & Solfege for every phrase
  phrases.forEach((p) => {
    alignWordsToPhraseNoteBars(p, noteBars, undefined, rawMonoPcm, sampleRate);
  });

  // 3. Layer 1A: Check LocalStorage user cache
  const cached = loadLyricsFromLocalCache(fileName, durationMs);
  if (cached && cached.phrases.length === phrases.length) {
    phrases.forEach((p, idx) => {
      const cp = cached.phrases[idx];
      p.isInstrumentalOrVocalize = cp.isInstrumentalOrVocalize;
      alignWordsToPhraseNoteBars(p, noteBars, cp.lyricText, rawMonoPcm, sampleRate);
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
    alignPlainTextToPhrases(phrases, noteBars, demoLines.join('\n'), rawMonoPcm, sampleRate);
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
      alignLrcLinesToPhrases(phrases, noteBars, lrcLines, rawMonoPcm, sampleRate);
    } else {
      alignPlainTextToPhrases(phrases, noteBars, embeddedText, rawMonoPcm, sampleRate);
    }
    return {
      lyricSource: 'embedded_tag',
      lyricStatus: 'complete',
    };
  }

  // 6. Layer 3: Query Open LRCLIB API by filename & duration
  const autoCloud = await fetchAutoLyricsFromLrclib(fileName, durationMs);
  if (autoCloud && (autoCloud.syncedLyrics || autoCloud.plainLyrics)) {
    if (autoCloud.syncedLyrics) {
      const lrcLines = parseLrcContent(autoCloud.syncedLyrics);
      if (lrcLines.length > 0) {
        alignLrcLinesToPhrases(phrases, noteBars, lrcLines, rawMonoPcm, sampleRate);
        return {
          lyricSource: 'auto_lrclib',
          lyricStatus: 'complete',
          matchedTrackTitle: autoCloud.matchedTitle,
        };
      }
    }
    if (autoCloud.plainLyrics) {
      alignPlainTextToPhrases(phrases, noteBars, autoCloud.plainLyrics, rawMonoPcm, sampleRate);
      return {
        lyricSource: 'auto_lrclib',
        lyricStatus: 'complete',
        matchedTrackTitle: autoCloud.matchedTitle,
      };
    }
  }

  // 7. Layer 4: Acoustic Formant Vowel-Syllable + Solfege relative lyrics (already populated in step 2!)
  return {
    lyricSource: 'acoustic_relative',
    lyricStatus: 'relative_auto',
  };
}

/**
 * Search and trace phrases by keyword (Vietnamese accent-insensitive), section name, note, phrase number, or timestamp!
 */
export function searchAndTracePhrases(phrases: IVocalPhrase[], rawQuery: string): IVocalPhrase[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return phrases;

  const matchByTimestampMs = (targetMs: number): IVocalPhrase[] => {
    // 1. Exact contain
    const exact = phrases.filter((p) => targetMs >= p.startMs && targetMs <= p.endMs);
    if (exact.length > 0) return exact;
    // 2. Near boundary (within 400ms)
    const near = phrases.filter((p) => targetMs >= p.startMs - 400 && targetMs <= p.endMs + 400);
    if (near.length > 0) return near;
    // 3. Closest phrase
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
    const targetMs = (parseInt(timeColonMatch[1], 10) * 60 + parseInt(timeColonMatch[2], 10)) * 1000;
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

  // 3. Full text & metadata search (Lyric text, Solfege, Acoustic syllables, Section label, Notes, Difficulty)
  const normQuery = normalizeVietnameseSearch(trimmed);
  return phrases.filter((p) => {
    const searchableBlob = normalizeVietnameseSearch(
      [
        `cau ${p.phraseIndex}`,
        p.lyricText || '',
        p.solfegeText || '',
        p.acousticText || '',
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
    alignWordsToPhraseNoteBars(copy, result.noteBars, newLyricText);
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
    .filter((t) => t && !t.includes('('))
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
    mergedText || `${first.lyricText || ''} ${second.lyricText || ''}`.trim()
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
  if (target.durationMs < 800) return result; // Too short to split safely

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

  const leftText =
    leftWords.length > 0
      ? leftWords.map((w) => w.text).join(' ')
      : target.lyricText?.split(/\s+/).slice(0, Math.ceil((target.lyricText?.split(/\s+/).length || 2) / 2)).join(' ');
  const rightText =
    rightWords.length > 0
      ? rightWords.map((w) => w.text).join(' ')
      : target.lyricText?.split(/\s+/).slice(Math.ceil((target.lyricText?.split(/\s+/).length || 2) / 2)).join(' ');

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

  alignWordsToPhraseNoteBars(leftPhrase, result.noteBars, leftText);
  alignWordsToPhraseNoteBars(rightPhrase, result.noteBars, rightText);

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
