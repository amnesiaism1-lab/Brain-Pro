/**
 * Vietnamese Lexical Tone & Melodic Contour Harmony Engine (vietnameseToneProsodyService.ts)
 *
 * Implements:
 * 1. 6-Tone Vietnamese Phonological Classification & Pitch Register Rank Hierarchy:
 *    - Dấu Nặng (.)  : Rank 1.0 (Đáy âm vực / Thấp nhất / Low Glottalized - Chao 21/11)
 *    - Dấu Huyền (\) : Rank 2.0 (Trầm xuôi / Low Falling - Chao 31/32)
 *    - Thanh Bằng ( ) : Rank 3.0 (Trục quy chiếu âm giai chính / Mid Level - Chao 33/44)
 *    - Dấu Hỏi (?)   : Rank 3.8 (Võng lên / Dipping-Rising - Chao 313/324)
 *    - Dấu Ngã (~)   : Rank 4.4 (Cao gãy / High Broken - Chao 35/45)
 *    - Dấu Sắc (/)   : Rank 5.0 (Đỉnh cao trào / Cao nhất / High Rising - Chao 45/35)
 *
 * 2. Inter-Syllable Melodic Transition Concordance Matrix (Ma trận Tương Hợp Thanh Điệu - Cao Độ):
 *    - Enforces Directional Concordance: Rising tone delta must map to ascending musical pitch.
 *    - Detects & penalizes "Tonal Inversion Violations" (Hát ngược dấu, ví dụ: Nặng -> Sắc mà nốt đi xuống).
 *
 * 3. Phrase-Level Global Harmonic Anchor Validation:
 *    - Verifies lowest note anchor (Min-MIDI) aligns to Nặng / Huyền / Ngang.
 *    - Verifies highest note apex (Max-MIDI) aligns to Sắc / Ngã / Hỏi / Ngang.
 *
 * 4. Spearman Rank-Order Correlation & Vietnamese Prosodic Naturalness Index (VPNI):
 *    - Quantifies melodic-tonal naturalness of lyric alignments from 0% to 100%.
 */

export type VietnameseToneType =
  | 'nang'
  | 'huyen'
  | 'ngang'
  | 'hoi'
  | 'nga'
  | 'sac'
  | 'neutral';

export interface IVietnameseToneInfo {
  word: string;
  toneType: VietnameseToneType;
  toneRank: number;
  toneNameVi: string;
  symbol: string;
  descriptionVi: string;
  musicalRoleVi: string;
}

export interface IToneMelodicTransitionAnalysis {
  wordA: string;
  wordB: string;
  toneA: VietnameseToneType;
  toneB: VietnameseToneType;
  rankDelta: number;
  midiDelta: number;
  isConcordant: boolean;
  isInverted: boolean;
  violationSeverity: 'none' | 'mild' | 'severe';
  penaltyOrBonusCost: number;
  explanationVi: string;
}

export interface IVietnameseToneHarmonyReport {
  overallScorePercent: number;
  concordanceRatioPercent: number;
  spearmanCorrelation: number;
  totalTransitions: number;
  concordantTransitions: number;
  invertedViolationsCount: number;
  lowestToneAnchorCheck: {
    passed: boolean;
    lowestMidiWord: string;
    toneType: VietnameseToneType;
    explanationVi: string;
  };
  highestToneAnchorCheck: {
    passed: boolean;
    highestMidiWord: string;
    toneType: VietnameseToneType;
    explanationVi: string;
  };
  transitions: IToneMelodicTransitionAnalysis[];
  prosodyGradeVi: string;
  detailedFeedbackVi: string;
}

/**
 * Standardized Relative Pitch Hierarchy Scale (Thang Bậc Cao Độ Thanh Điệu Chuẩn Hóa)
 */
export const TONE_PITCH_RANK: Record<VietnameseToneType, number> = {
  nang: 1.0,    // Đáy âm vực / Thấp nhất
  huyen: 2.0,   // Trầm xuôi
  ngang: 3.0,   // Âm giai chính / Trục quy chiếu trung tính
  hoi: 3.8,     // Võng lên
  nga: 4.4,     // Cao gãy
  sac: 5.0,     // Đỉnh cao nhất
  neutral: 3.0, // Trung tính
};

export const TONE_METADATA: Record<
  VietnameseToneType,
  { nameVi: string; symbol: string; desc: string; role: string }
> = {
  nang: {
    nameVi: 'Thanh Nặng',
    symbol: '̣',
    desc: 'Trầm ngắt, âm vực đáy (Chao 21/11)',
    role: 'Nốt trầm nhất, nốt gốc hợp âm (Root), nốt kết hạ',
  },
  huyen: {
    nameVi: 'Thanh Huyền',
    symbol: '̀',
    desc: 'Trầm giáng, xuôi êm ái (Chao 31/32)',
    role: 'Âm vực trầm vừa, nâng đỡ nốt bằng, trôi êm xuống',
  },
  ngang: {
    nameVi: 'Thanh Ngang (Bằng)',
    symbol: '—',
    desc: 'Trung âm cơ bản, ổn định (Chao 33/44)',
    role: 'Âm giai chính (Tonic), trục quy chiếu giai điệu, hòa thanh chủ',
  },
  hoi: {
    nameVi: 'Thanh Hỏi',
    symbol: '̉',
    desc: 'Trung cao võng lên (Chao 313/324)',
    role: 'Lượn sóng biểu cảm, cao hơn nốt bằng khi kết âm',
  },
  nga: {
    nameVi: 'Thanh Ngã',
    symbol: '̃',
    desc: 'Cao gãy, vút kịch tính (Chao 35/45)',
    role: 'Nốt cao trào, hòa âm căng thẳng (Dominant 7th/Suspended)',
  },
  sac: {
    nameVi: 'Thanh Sắc',
    symbol: '́',
    desc: 'Cao vút rực rỡ, đỉnh dải tần (Chao 45/35)',
    role: 'Đỉnh cao nhất (Melodic Apex), bước nhảy vọt lên cao',
  },
  neutral: {
    nameVi: 'Trung Tính',
    symbol: '·',
    desc: 'Không xác định / Từ ngoại lai',
    role: 'Trục quy chiếu chuẩn',
  },
};

/**
 * Extract Vietnamese Tone Type from any raw Vietnamese word/syllable using Unicode NFD decomposition
 */
export function getVietnameseToneType(rawWord: string): VietnameseToneType {
  if (!rawWord) return 'neutral';
  const clean = rawWord.trim().toLowerCase();
  if (!clean) return 'neutral';

  const nfd = clean.normalize('NFD');

  // Check Unicode Combining Diacritical Marks
  if (/\u0323/.test(nfd)) return 'nang';  // Combining Dot Below (.)
  if (/\u0300/.test(nfd)) return 'huyen'; // Combining Grave Accent (\)
  if (/\u0309/.test(nfd)) return 'hoi';   // Combining Hook Above (?)
  if (/\u0303/.test(nfd)) return 'nga';   // Combining Tilde (~)
  if (/\u0301/.test(nfd)) return 'sac';   // Combining Acute Accent (/)

  // If contains Vietnamese alphabets without tone mark -> Thanh Ngang
  if (/[a-zà-ỹđ]/i.test(clean)) {
    return 'ngang';
  }

  return 'neutral';
}

/**
 * Get full tone metadata for a word
 */
export function getVietnameseToneInfo(rawWord: string): IVietnameseToneInfo {
  const toneType = getVietnameseToneType(rawWord);
  const toneRank = TONE_PITCH_RANK[toneType];
  const meta = TONE_METADATA[toneType];

  return {
    word: rawWord,
    toneType,
    toneRank,
    toneNameVi: meta.nameVi,
    symbol: meta.symbol,
    descriptionVi: meta.desc,
    musicalRoleVi: meta.role,
  };
};

/**
 * Evaluate the melodic transition concordance between two consecutive words and their mapped MIDI notes.
 *
 * Cost System:
 * - Negative values = Concordant bonus (Natural melody matches tone direction)
 * - Zero = Neutral
 * - Positive values = Inversion penalty (Violates Vietnamese tone rules, "ngọng dấu")
 */
export function computeToneMelodicTransitionCost(
  wordA: string,
  wordB: string,
  midiA: number,
  midiB: number
): IToneMelodicTransitionAnalysis {
  const toneA = getVietnameseToneType(wordA);
  const toneB = getVietnameseToneType(wordB);
  const rankA = TONE_PITCH_RANK[toneA];
  const rankB = TONE_PITCH_RANK[toneB];

  const rankDelta = rankB - rankA;
  const midiDelta = midiB - midiA;

  let isConcordant = true;
  let isInverted = false;
  let severity: 'none' | 'mild' | 'severe' = 'none';
  let cost = 0;
  let explanationVi = '';

  const metaA = TONE_METADATA[toneA];
  const metaB = TONE_METADATA[toneB];

  // Case 1: Strong Tone Ascending (rankDelta >= +1.0)
  // e.g. Nặng -> Ngang, Huyền -> Sắc, Ngang -> Sắc, Nặng -> Sắc
  if (rankDelta >= 0.8) {
    if (midiDelta >= 1) {
      // Natural ascending: bonus increases with proper musical pitch rise
      isConcordant = true;
      cost = -Math.min(4.5, 1.8 + Math.min(midiDelta, 7) * 0.4);
      explanationVi = `Thuận thanh điệu: ${metaA.nameVi} lên ${metaB.nameVi} đi cùng nốt lên (+${midiDelta} bán âm).`;
    } else if (midiDelta === 0) {
      // Level pitch: acceptable in modern music, slightly neutral
      isConcordant = true;
      cost = -0.5;
      explanationVi = `Hòa hoãn: ${metaA.nameVi} sang ${metaB.nameVi} giữ cùng cao độ.`;
    } else {
      // Inverted: Tone goes up but melodic pitch goes down! (Ngọng dấu)
      isInverted = true;
      isConcordant = false;
      const pitchDrop = Math.abs(midiDelta);

      if (rankDelta >= 2.0 && pitchDrop >= 2) {
        // Severe: e.g. Nặng -> Sắc but pitch drops 2+ semitones!
        severity = 'severe';
        cost = 14.0 + pitchDrop * 1.5;
        explanationVi = `Nghịch thanh nghiêm trọng: ${metaA.nameVi} sang ${metaB.nameVi} nhưng nốt lại tụt dốc (${midiDelta} bán âm).`;
      } else if (pitchDrop === 1) {
        // 1-semitone musical nuance / artistic license in modern V-Pop
        severity = 'mild';
        cost = 2.0;
        explanationVi = `Biến tấu giai điệu: ${metaA.nameVi} sang ${metaB.nameVi} (${midiDelta} bán âm).`;
      } else {
        severity = 'mild';
        cost = 5.0 + pitchDrop * 0.7;
        explanationVi = `Lệch thanh nhẹ: ${metaA.nameVi} sang ${metaB.nameVi} (${midiDelta} bán âm).`;
      }
    }
  }
  // Case 2: Strong Tone Descending (rankDelta <= -0.8)
  // e.g. Sắc -> Nặng, Sắc -> Huyền, Ngang -> Nặng, Ngã -> Huyền
  else if (rankDelta <= -0.8) {
    if (midiDelta <= -1) {
      // Natural descending: bonus
      isConcordant = true;
      cost = -Math.min(4.5, 1.8 + Math.min(Math.abs(midiDelta), 7) * 0.4);
      explanationVi = `Thuận thanh điệu: ${metaA.nameVi} xuống ${metaB.nameVi} đi cùng nốt xuống (${midiDelta} bán âm).`;
    } else if (midiDelta === 0) {
      isConcordant = true;
      cost = -0.5;
      explanationVi = `Hòa hoãn: ${metaA.nameVi} sang ${metaB.nameVi} giữ cùng cao độ.`;
    } else {
      // Inverted: Tone goes down but melodic pitch jumps up!
      isInverted = true;
      isConcordant = false;
      const pitchRise = midiDelta;

      if (Math.abs(rankDelta) >= 2.0 && pitchRise >= 2) {
        severity = 'severe';
        cost = 14.0 + pitchRise * 1.5;
        explanationVi = `Nghịch thanh nghiêm trọng: ${metaA.nameVi} xuống ${metaB.nameVi} nhưng nốt lại nhảy vọt lên (+${midiDelta} bán âm).`;
      } else if (pitchRise === 1) {
        severity = 'mild';
        cost = 2.0;
        explanationVi = `Biến tấu giai điệu: ${metaA.nameVi} xuống ${metaB.nameVi} (+${midiDelta} bán âm).`;
      } else {
        severity = 'mild';
        cost = 5.0 + pitchRise * 0.7;
        explanationVi = `Lệch thanh nhẹ: ${metaA.nameVi} xuống ${metaB.nameVi} (+${midiDelta} bán âm).`;
      }
    }
  }
  // Case 3: Level / Very close Tone (e.g. Ngang -> Ngang, Huyền -> Nặng nhẹ, Hỏi -> Ngã)
  else {
    if (Math.abs(midiDelta) <= 2) {
      isConcordant = true;
      cost = -1.2;
      explanationVi = `Hài hòa bằng phẳng: ${metaA.nameVi} sang ${metaB.nameVi} trong biên độ ổn định (Δ${midiDelta}st).`;
    } else {
      // Musical leap on same tone level: allowed in melody, small penalty only if excessive
      cost = Math.abs(midiDelta) >= 7 ? 2.5 : 0;
      explanationVi = `Nhảy quãng âm nhạc trên thanh tương đồng: Δ${midiDelta} bán âm.`;
    }
  }

  return {
    wordA,
    wordB,
    toneA,
    toneB,
    rankDelta,
    midiDelta,
    isConcordant,
    isInverted,
    violationSeverity: severity,
    penaltyOrBonusCost: cost,
    explanationVi,
  };
}

/**
 * Compute Spearman Rank-Order Correlation Coefficient between two numeric series
 */
export function computeSpearmanRankCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n <= 1) return 1.0;

  const rankArray = (arr: number[]): number[] => {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((x, y) => x.val - y.val);
    const ranks = new Array(n).fill(0);
    for (let i = 0; i < n; ) {
      let j = i;
      while (j < n && indexed[j].val === indexed[i].val) j++;
      const avgRank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = avgRank;
      }
      i = j;
    }
    return ranks;
  };

  const ranksA = rankArray(a.slice(0, n));
  const ranksB = rankArray(b.slice(0, n));

  let dSquaredSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = ranksA[i] - ranksB[i];
    dSquaredSum += diff * diff;
  }

  const rho = 1 - (6 * dSquaredSum) / (n * (n * n - 1));
  return Math.max(-1, Math.min(1, Math.round(rho * 1000) / 1000));
}

/**
 * Comprehensive Phrase-Level Tone & Melodic Contour Harmony Analysis
 */
export function computePhraseToneMelodicHarmony(
  tokens: string[],
  midiSequence: number[]
): IVietnameseToneHarmonyReport {
  const count = Math.min(tokens.length, midiSequence.length);

  if (count <= 1) {
    return {
      overallScorePercent: 100,
      concordanceRatioPercent: 100,
      spearmanCorrelation: 1.0,
      totalTransitions: 0,
      concordantTransitions: 0,
      invertedViolationsCount: 0,
      lowestToneAnchorCheck: {
        passed: true,
        lowestMidiWord: tokens[0] || '',
        toneType: getVietnameseToneType(tokens[0] || ''),
        explanationVi: 'Câu đơn âm tiết.',
      },
      highestToneAnchorCheck: {
        passed: true,
        highestMidiWord: tokens[0] || '',
        toneType: getVietnameseToneType(tokens[0] || ''),
        explanationVi: 'Câu đơn âm tiết.',
      },
      transitions: [],
      prosodyGradeVi: 'Tự nhiên tuyệt đối',
      detailedFeedbackVi: 'Câu hát đạt độ tương hợp thanh điệu chuẩn mực.',
    };
  }

  const transitions: IToneMelodicTransitionAnalysis[] = [];
  let concordantCount = 0;
  let invertedCount = 0;
  let totalTransitions = count - 1;

  for (let i = 0; i < totalTransitions; i++) {
    const t = computeToneMelodicTransitionCost(
      tokens[i],
      tokens[i + 1],
      midiSequence[i],
      midiSequence[i + 1]
    );
    transitions.push(t);
    if (t.isConcordant) concordantCount++;
    if (t.isInverted) invertedCount++;
  }

  // 1. Concordance Ratio (0-100%)
  const concordanceRatioPercent =
    totalTransitions > 0
      ? Math.round((concordantCount / totalTransitions) * 100)
      : 100;

  // 2. Global Lowest Note Anchor Check
  let minMidi = Infinity;
  let minIdx = 0;
  let maxMidi = -Infinity;
  let maxIdx = 0;

  for (let i = 0; i < count; i++) {
    if (midiSequence[i] < minMidi) {
      minMidi = midiSequence[i];
      minIdx = i;
    }
    if (midiSequence[i] > maxMidi) {
      maxMidi = midiSequence[i];
      maxIdx = i;
    }
  }

  const lowestWord = tokens[minIdx];
  const lowestTone = getVietnameseToneType(lowestWord);
  const lowestRank = TONE_PITCH_RANK[lowestTone];
  // Lowest note is ideal if it's Nặng, Huyền, or Ngang (rank <= 3.0), avoid Sắc (5.0)
  const lowestPassed = lowestRank <= 3.2;
  const lowestExplanationVi = lowestPassed
    ? `Chuẩn vị trí: Nốt trầm nhất câu rơi vào từ "${lowestWord}" mang ${TONE_METADATA[lowestTone].nameVi} (hợp âm gốc/âm vực đáy).`
    : `Cảnh báo: Nốt trầm nhất lại rơi vào từ "${lowestWord}" mang ${TONE_METADATA[lowestTone].nameVi} (thường là thanh cao).`;

  // 3. Global Highest Note Anchor Check
  const highestWord = tokens[maxIdx];
  const highestTone = getVietnameseToneType(highestWord);
  const highestRank = TONE_PITCH_RANK[highestTone];
  // Highest note is ideal if it's Sắc, Ngã, Hỏi, or Ngang (rank >= 3.0), avoid Nặng (1.0)
  const highestPassed = highestRank >= 2.8;
  const highestExplanationVi = highestPassed
    ? `Chuẩn đỉnh cao: Nốt cao nhất câu thuộc từ "${highestWord}" mang ${TONE_METADATA[highestTone].nameVi} (đỉnh giai điệu/cao trào).`
    : `Cảnh báo: Nốt cao nhất câu lại rơi vào từ "${highestWord}" mang ${TONE_METADATA[highestTone].nameVi} (thường là thanh trầm đáy).`;

  // 4. Spearman Rank Correlation between Tone Ranks and MIDI pitches
  const toneRanks = tokens.map((tk) => TONE_PITCH_RANK[getVietnameseToneType(tk)]);
  const spearman = computeSpearmanRankCorrelation(toneRanks, midiSequence);

  // 5. Composite Prosody Harmony Score (0-100)
  // Weighting: 55% Concordance Ratio + 25% Spearman Correlation + 10% Lowest Anchor + 10% Highest Anchor
  const spearmanNormalized = Math.max(0, Math.min(100, Math.round(((spearman + 1) / 2) * 100)));
  const anchorScore = (lowestPassed ? 50 : 15) + (highestPassed ? 50 : 15);

  const overallScorePercent = Math.max(
    30,
    Math.min(
      100,
      Math.round(
        concordanceRatioPercent * 0.55 +
          spearmanNormalized * 0.25 +
          anchorScore * 0.2
      )
    )
  );

  let prosodyGradeVi = 'Hài hòa cao';
  if (overallScorePercent >= 90) prosodyGradeVi = 'Tự nhiên tuyệt đối';
  else if (overallScorePercent >= 75) prosodyGradeVi = 'Hài hòa chuẩn ngữ âm';
  else if (overallScorePercent >= 60) prosodyGradeVi = 'Biến tấu giai điệu nghệ thuật';
  else prosodyGradeVi = 'Có đoạn lệch thanh điệu (cần lưu ý)';

  const detailedFeedbackVi = `${prosodyGradeVi} (${overallScorePercent}%): ${concordantCount}/${totalTransitions} bước chuyển thuận thanh điệu. ${
    invertedCount > 0 ? `Phát hiện ${invertedCount} chỗ lệch thanh cần chú ý.` : 'Giai điệu thuận thanh điệu tự nhiên.'
  } ${lowestPassed ? 'Nốt trầm tựa đúng thanh trầm.' : ''} ${
    highestPassed ? 'Nốt đỉnh vút đúng thanh cao.' : ''
  }`.trim();

  return {
    overallScorePercent,
    concordanceRatioPercent,
    spearmanCorrelation: spearman,
    totalTransitions,
    concordantTransitions: concordantCount,
    invertedViolationsCount: invertedCount,
    lowestToneAnchorCheck: {
      passed: lowestPassed,
      lowestMidiWord: lowestWord,
      toneType: lowestTone,
      explanationVi: lowestExplanationVi,
    },
    highestToneAnchorCheck: {
      passed: highestPassed,
      highestMidiWord: highestWord,
      toneType: highestTone,
      explanationVi: highestExplanationVi,
    },
    transitions,
    prosodyGradeVi,
    detailedFeedbackVi,
  };
}

/**
 * Pre-Filter / Re-Rank DP Candidates based on Vietnamese Tonal-Melodic Concordance
 *
 * Used before and inside dynamic programming to eliminate unrealistic word-to-note pairings
 * where low tones (nặng, huyền) are forced into sharp pitch peaks or high tones (sắc) into deep bass dips.
 */
export function filterOrScoreCandidateAlignment(
  wordTokens: string[],
  barMidis: number[]
): number {
  if (wordTokens.length === 0 || barMidis.length === 0) return 0;
  const analysis = computePhraseToneMelodicHarmony(wordTokens, barMidis);
  // Returns penalty cost: 0 for 100% natural, higher for unnatural
  return Math.max(0, (100 - analysis.overallScorePercent) * 0.25);
}

