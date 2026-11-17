/**
 * Anchor-Constrained Bidirectional Sequence Alignment Engine (`sequenceAlignmentEngine.ts`)
 *
 * Eliminates cascading domino alignment errors ("1 thằng bị lệch -> các thằng sau bị lệch") at the
 * phrase / LRC-line level through:
 * 1. `findSparseAnchorChainOffsets`: Non-greedy 1D Viterbi Anchor Chain + MAD Neighborhood Outlier Pruning
 *    for tempo-drift calibration without compounding errors across lines.
 * 2. `alignWindowSymmetricDP`: 5-way Needleman-Wunsch / Semi-Global Sequence Aligner supporting simultaneous
 *    1-to-1 Match, Skip Audio Cluster (`missing_lyric` gap), Skip Lyric Line (omitted line),
 *    2-Lines-to-1-Cluster Merge, and 1-Line-to-2-Clusters Merge, scored by syllable density, duration fit,
 *    breath pauses, local timing, and Vietnamese tone-melody harmony.
 * 3. `repairDamagedPhraseWindowsLocally`: Isolates contaminated contiguous windows strictly between
 *    verified high-confidence Anchor Islands and repairs them locally without perturbing surrounding anchors.
 */

import type { IVocalNoteBar, IVocalPhrase } from './vocalFileAnalysisService';
import { computePhraseToneMelodicHarmony } from './vietnameseToneProsodyService';

export interface IPhoneticEvaluationResult {
  phoneticBonusCost: number;
  acousticSyllableCount?: number;
  hasUsableAudio: boolean;
}

export type PhoneticClusterSlice = {
  bars: IVocalNoteBar[];
  startMs: number;
  endMs: number;
};

export type PhoneticEvaluationFn = (
  tokens: string[],
  clusterSlices: PhoneticClusterSlice[]
) => IPhoneticEvaluationResult;

export interface ISymmetricLyricInput {
  text: string;
  timeMs?: number;
  postGapMs?: number;
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  originalLineIdx?: number;
}

export interface ISymmetricClusterInput {
  bars: IVocalNoteBar[];
  startMs: number;
  endMs: number;
  postGapMs: number;
  originalClusterIdx?: number;
  acousticSyllableCount?: number;
}

export interface ISymmetricAlignmentOp {
  kind: 'match' | 'skip_cluster' | 'skip_line' | 'merge_2_lines' | 'merge_2_clusters';
  lineIndices: number[];
  clusterIndices: number[];
  bars: IVocalNoteBar[];
  text?: string;
  timeMs?: number;
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
}

/**
 * Strictly select NoteBars whose temporal midpoint lies within `[startMs - toleranceMs, endMs + toleranceMs]`.
 */
export function filterNoteBarsInTimeRange(
  startMs: number,
  endMs: number,
  allNoteBars: IVocalNoteBar[],
  toleranceMs = 15
): IVocalNoteBar[] {
  return allNoteBars.filter((b) => {
    const mid = (b.startTimeMs + b.endTimeMs) / 2;
    return mid >= startMs - toleranceMs && mid <= endMs + toleranceMs;
  });
}

/**
 * Return the single active wordIndex at `timeMs` without double-highlighting adjacent words.
 * Uses strict interval ownership first, allowing at most a tiny bounded pre-onset visual lead (<= 22ms)
 * that never overlaps the preceding word's active span.
 */
export function findActiveWordIndexAtTime(
  words: Array<{ wordIndex: number; startMs: number; endMs: number }>,
  timeMs: number
): number {
  if (!words || words.length === 0) return -1;

  let exactIdx = -1;
  let bestMidDist = Infinity;
  for (const w of words) {
    if (timeMs >= w.startMs && timeMs <= w.endMs) {
      const midDist = Math.abs((w.startMs + w.endMs) / 2 - timeMs);
      if (midDist < bestMidDist) {
        bestMidDist = midDist;
        exactIdx = w.wordIndex;
      }
    }
  }
  if (exactIdx >= 0) return exactIdx;

  // Bounded edge tolerance without bleeding across adjacent word boundaries
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prevEnd = i > 0 ? words[i - 1].endMs : -Infinity;
    const nextStart = i + 1 < words.length ? words[i + 1].startMs : Infinity;
    const leadBound = Math.max(w.startMs - 22, (prevEnd + w.startMs) / 2);
    const tailBound = Math.min(w.endMs + 22, (w.endMs + nextStart) / 2);
    if (timeMs >= leadBound && timeMs <= tailBound) {
      return w.wordIndex;
    }
  }

  return -1;
}

/**
 * Compute median of a numeric array safely.
 */
function medianNumber(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Group NoteBars into natural singing clusters separated by silence pauses > `maxGapMs`
 * or excessive duration > `maxClusterSpanMs`.
 */
export function clusterNoteBarsBySilence(
  bars: IVocalNoteBar[],
  maxGapMs = 380,
  maxClusterSpanMs = 6200
): IVocalNoteBar[][] {
  if (bars.length === 0) return [];
  const sorted = [...bars].sort((a, b) => a.startTimeMs - b.startTimeMs);
  const clusters: IVocalNoteBar[][] = [];
  let cur: IVocalNoteBar[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].startTimeMs - sorted[i - 1].endTimeMs;
    if (gap <= maxGapMs && sorted[i].endTimeMs - cur[0].startTimeMs <= maxClusterSpanMs) {
      cur.push(sorted[i]);
    } else {
      clusters.push(cur);
      cur = [sorted[i]];
    }
  }
  clusters.push(cur);
  return clusters;
}

/**
 * Split genuinely oversized fused NoteBar clusters at clear internal pauses or pronounced
 * multi-phrase boundaries when `P < L`, without artificially slicing normal single phrases
 * when `L > P` is actually caused by skipped lyric lines.
 */
export function expandClustersTowardCount(
  clusters: IVocalNoteBar[][],
  targetMinClusters: number,
  expectedAvgWordsPerLine = 5
): IVocalNoteBar[][] {
  let working = [...clusters];
  const minSecondaryBars = Math.max(7, Math.round(expectedAvgWordsPerLine * 1.55));
  while (working.length < targetMinClusters) {
    let bestClusterIdx = -1;
    let bestSplitIdx = -1;
    let bestSplitScore = 155;

    for (let ci = 0; ci < working.length; ci++) {
      const c = working[ci];
      const dur = c[c.length - 1].endTimeMs - c[0].startTimeMs;
      if (c.length < 4 || dur < 1550) continue;
      for (let bi = 1; bi < c.length - 1; bi++) {
        const g = c[bi].startTimeMs - c[bi - 1].endTimeMs;
        if (g > bestSplitScore) {
          bestSplitScore = g;
          bestClusterIdx = ci;
          bestSplitIdx = bi;
        }
      }
    }

    if (bestClusterIdx === -1) {
      let bestSecondaryScore = 0;
      for (let ci = 0; ci < working.length; ci++) {
        const c = working[ci];
        const dur = c[c.length - 1].endTimeMs - c[0].startTimeMs;
        if (c.length < minSecondaryBars || dur < 2900) continue;
        for (let bi = 2; bi < c.length - 2; bi++) {
          const g = Math.max(0, c[bi].startTimeMs - c[bi - 1].endTimeMs);
          const pitchJump = Math.abs(c[bi].midi - c[bi - 1].midi);
          if (g < 85 && pitchJump < 3) continue;
          const secScore = g * 0.25 + pitchJump * 2.5 + dur * 0.002;
          if (secScore > bestSecondaryScore) {
            bestSecondaryScore = secScore;
            bestClusterIdx = ci;
            bestSplitIdx = bi;
          }
        }
      }
    }

    if (bestClusterIdx === -1 || bestSplitIdx === -1) break;
    const target = working[bestClusterIdx];
    working = [
      ...working.slice(0, bestClusterIdx),
      target.slice(0, bestSplitIdx),
      target.slice(bestSplitIdx),
      ...working.slice(bestClusterIdx + 1),
    ];
  }
  return working;
}

/**
 * Sparse Anchor-Chain Viterbi + MAD Outlier Pruning (`findSparseAnchorChainOffsets`):
 * Replaces greedy left-to-right offset accumulation so a single mis-snapped line cannot corrupt
 * `prevAnchorOffset` / `lastMatchedTime` or drag subsequent lines out of sync.
 */
export function findSparseAnchorChainOffsets(params: {
  phrases: IVocalPhrase[];
  noteBars: IVocalNoteBar[];
  lrcLines: Array<{ timeMs: number; text: string }>;
  baseOffsetMs: number;
  evaluatePhoneticMatch?: PhoneticEvaluationFn;
}): number[] {
  const { phrases, noteBars, lrcLines, baseOffsetMs, evaluatePhoneticMatch } = params;
  const L = lrcLines.length;
  const offsets = Array.from({ length: L }, () => baseOffsetMs);
  if (L < 3 || (phrases.length === 0 && noteBars.length === 0)) return offsets;

  const rawOnsets: number[] = [];
  phrases.forEach((p) => {
    if (!p.isInstrumentalOrVocalize && p.durationMs >= 350) {
      rawOnsets.push(p.startMs);
    }
  });
  for (let i = 1; i < noteBars.length; i++) {
    if (noteBars[i].startTimeMs - noteBars[i - 1].endTimeMs >= 240) {
      rawOnsets.push(noteBars[i].startTimeMs);
    }
  }
  if (rawOnsets.length === 0) return offsets;
  rawOnsets.sort((a, b) => a - b);

  // Deduplicate close onsets within 110ms
  const vocalOnsets: number[] = [];
  for (const on of rawOnsets) {
    if (vocalOnsets.length === 0 || on - vocalOnsets[vocalOnsets.length - 1] >= 110) {
      vocalOnsets.push(on);
    }
  }

  interface ICandidateAnchor {
    onsetMs: number;
    offsetMs: number;
    localScore: number; // higher is better
  }

  const lineCandidates: ICandidateAnchor[][] = lrcLines.map((line, i) => {
    const nominal = line.timeMs + baseOffsetMs;
    const tokens = line.text.trim().split(/\s+/).filter(Boolean);
    const wordCount = Math.max(1, tokens.length);
    const nextLineGap = i + 1 < L ? Math.max(400, lrcLines[i + 1].timeMs - line.timeMs) : 4500;
    const windowDur = Math.min(nextLineGap, Math.max(1600, wordCount * 580));

    // In long tracks with progressive tempo drift (+2200ms over 30s), allow wider search proportional to song progression
    const maxSearchRadius = L <= 10 ? 2500 : 1900;
    const cands: ICandidateAnchor[] = [];

    for (const onset of vocalOnsets) {
      const dist = Math.abs(onset - nominal);
      if (dist > maxSearchRadius) continue;

      const offsetMs = onset - line.timeMs;
      // Sanity check noteBars coverage starting around candidate onset
      const winBars = filterNoteBarsInTimeRange(onset - 50, onset + windowDur, noteBars, 30);
      const phonetic =
        evaluatePhoneticMatch && winBars.length > 0
          ? evaluatePhoneticMatch(tokens, [
              {
                bars: winBars,
                startMs: winBars[0].startTimeMs,
                endMs: winBars[winBars.length - 1].endTimeMs,
              },
            ])
          : null;
      // Never promote a phonetically contradicting line into a tempo-shifting anchor!
      if (phonetic?.hasUsableAudio && phonetic.phoneticBonusCost >= 1.4) {
        continue;
      }
      const effectiveUnits =
        phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
          ? Math.max(winBars.length, phonetic.acousticSyllableCount)
          : winBars.length;
      const densityRatio = effectiveUnits / Math.max(1, wordCount);
      const densityFit =
        winBars.length === 0
          ? -12
          : densityRatio >= 0.45 && densityRatio <= 2.3
          ? 7.5 - Math.abs(effectiveUnits - wordCount) * 0.5
          : 2.0;

      const phoneticScore = phonetic?.hasUsableAudio ? -phonetic.phoneticBonusCost * 1.45 : 0;
      const proximityScore = (maxSearchRadius - dist) * 0.008;
      const localScore = proximityScore + densityFit + phoneticScore;
      if (localScore > 2.5) {
        cands.push({ onsetMs: onset, offsetMs, localScore });
      }
    }

    cands.sort((a, b) => b.localScore - a.localScore);
    return cands.slice(0, 4);
  });

  // 1D Sparse Anchor-Chain DP:
  // Maximize score over an ordered subset of anchors; noisy/erratic lines stay UNANCHORED!
  const bestAt: number[][] = lineCandidates.map((cs) => cs.map((c) => c.localScore - Math.abs(c.offsetMs - baseOffsetMs) * 0.002));
  const prevLink: Array<Array<{ prevLine: number; prevCand: number } | null>> = lineCandidates.map(
    (cs) => cs.map(() => null)
  );

  for (let i = 1; i < L; i++) {
    const curCands = lineCandidates[i];
    if (curCands.length === 0) continue;

    // Look back over preceding lines so skipping erratic intermediate lines is seamless
    const lookbackStart = Math.max(0, i - 6);
    for (let ci = 0; ci < curCands.length; ci++) {
      const cur = curCands[ci];
      for (let pi = lookbackStart; pi < i; pi++) {
        const prevCands = lineCandidates[pi];
        for (let pci = 0; pci < prevCands.length; pci++) {
          const prev = prevCands[pci];
          if (cur.onsetMs < prev.onsetMs + 220) continue;
          const stepDiff = Math.abs(cur.offsetMs - prev.offsetMs);
          const maxAllowedJump = Math.min(1250, 620 + (i - pi - 1) * 260);
          if (stepDiff > maxAllowedJump) continue;

          // Smooth drift is mildly penalized relative to reward; abrupt jumps discouraged
          const driftPenalty = (stepDiff * 0.0035) / Math.max(1, i - pi);
          const candTotal = bestAt[pi][pci] + cur.localScore - driftPenalty;
          if (candTotal > bestAt[i][ci]) {
            bestAt[i][ci] = candTotal;
            prevLink[i][ci] = { prevLine: pi, prevCand: pci };
          }
        }
      }
    }
  }

  let bestFinalLine = -1;
  let bestFinalCand = -1;
  let bestFinalScore = 0;
  for (let i = 0; i < L; i++) {
    for (let ci = 0; ci < bestAt[i].length; ci++) {
      if (bestAt[i][ci] > bestFinalScore) {
        bestFinalScore = bestAt[i][ci];
        bestFinalLine = i;
        bestFinalCand = ci;
      }
    }
  }

  if (bestFinalLine < 0) return offsets;

  const rawAnchors: Array<{ idx: number; offsetMs: number }> = [];
  let curL = bestFinalLine;
  let curC = bestFinalCand;
  while (curL >= 0 && curC >= 0) {
    rawAnchors.push({ idx: curL, offsetMs: lineCandidates[curL][curC].offsetMs });
    const link = prevLink[curL][curC];
    if (!link) break;
    curL = link.prevLine;
    curC = link.prevCand;
  }
  rawAnchors.reverse();

  // Neighborhood MAD / Median Outlier Pruning:
  // Any isolated anchor jumping > 550ms above/below its 4 nearest anchors' median trend is stripped.
  const anchors = rawAnchors.filter((a, m) => {
    if (rawAnchors.length < 4) return true;
    const neighborVals: number[] = [];
    for (let k = Math.max(0, m - 2); k <= Math.min(rawAnchors.length - 1, m + 2); k++) {
      if (k !== m) neighborVals.push(rawAnchors[k].offsetMs);
    }
    const localMed = medianNumber(neighborVals);
    return Math.abs(a.offsetMs - localMed) <= 550;
  });

  if (anchors.length === 0) return offsets;

  for (let i = 0; i < L; i++) {
    if (i <= anchors[0].idx) {
      offsets[i] = anchors[0].offsetMs;
    } else if (i >= anchors[anchors.length - 1].idx) {
      offsets[i] = anchors[anchors.length - 1].offsetMs;
    } else {
      for (let a = 0; a < anchors.length - 1; a++) {
        const left = anchors[a];
        const right = anchors[a + 1];
        if (i >= left.idx && i <= right.idx) {
          const t = right.idx === left.idx ? 0 : (i - left.idx) / (right.idx - left.idx);
          offsets[i] = Math.round(left.offsetMs + t * (right.offsetMs - left.offsetMs));
          break;
        }
      }
    }
  }

  return offsets;
}

/**
 * Sample bar MIDI pitches evenly across `wordCount` slots so Vietnamese tone-melody concordance
 * can break ties cleanly between genuine vs shifted-by-1 phrase alignments.
 */
function sampleClusterMidisForWords(bars: IVocalNoteBar[], wordCount: number): number[] {
  if (bars.length === 0 || wordCount <= 0) return [];
  if (bars.length === wordCount) return bars.map((b) => b.midi);
  const out: number[] = [];
  for (let i = 0; i < wordCount; i++) {
    const bIdx = Math.min(bars.length - 1, Math.floor(((i + 0.5) / wordCount) * bars.length));
    out.push(bars[bIdx].midi);
  }
  return out;
}

/**
 * Symmetric 2-Way Sequence Aligner (`alignWindowSymmetricDP`):
 * Solves minimum-cost monotonic alignment between `lines[0..nL-1]` and `clusters[0..nC-1]`
 * allowing BOTH gaps (`skip_cluster` -> missing lyric gap, `skip_line` -> omitted line) AND
 * local 2-to-1 splits/merges (`merge_2_lines`, `merge_2_clusters`) so 1 missing/extra/merged
 * element NEVER triggers a domino cascade onto later lines!
 */
export function alignWindowSymmetricDP(params: {
  lines: ISymmetricLyricInput[];
  clusters: ISymmetricClusterInput[];
  windowStartMs: number;
  windowEndMs: number;
  useTimestampPrior: boolean;
  allowLineSkip?: boolean;
  allowClusterSkip?: boolean;
  allowMerge2Lines?: boolean;
  allowMerge2Clusters?: boolean;
  evaluatePhoneticMatch?: PhoneticEvaluationFn;
}): ISymmetricAlignmentOp[] {
  const {
    lines,
    clusters,
    windowStartMs,
    windowEndMs,
    useTimestampPrior,
    allowLineSkip = true,
    allowClusterSkip = true,
    allowMerge2Lines = true,
    allowMerge2Clusters = true,
    evaluatePhoneticMatch,
  } = params;

  const nL = lines.length;
  const nC = clusters.length;

  if (nL === 0 && nC === 0) return [];
  if (nL === 0) {
    return clusters.map((c, idx) => ({
      kind: 'skip_cluster',
      lineIndices: [],
      clusterIndices: [idx],
      bars: c.bars,
    }));
  }
  if (nC === 0) {
    return lines.map((l, idx) => ({
      kind: 'skip_line',
      lineIndices: [idx],
      clusterIndices: [],
      bars: [],
      text: l.text,
      timeMs: l.timeMs,
      wordTimestamps: l.wordTimestamps,
    }));
  }

  const lineWordsList = lines.map((l) => l.text.trim().split(/\s+/).filter(Boolean));
  const winSpanMs = Math.max(1000, windowEndMs - windowStartMs);

  const computeMatchCost = (
    lineIdxList: number[],
    combinedBars: IVocalNoteBar[],
    firstLineIdx: number,
    lastLineIdx: number,
    firstClusterIdx: number,
    lastClusterIdx: number
  ): number => {
    const tokens = lineIdxList.flatMap((idx) => lineWordsList[idx]);
    const wCnt = Math.max(1, tokens.length);
    const bCnt = combinedBars.length;
    const cStart = combinedBars[0].startTimeMs;
    const cEnd = combinedBars[bCnt - 1].endTimeMs;
    const cDur = Math.max(200, cEnd - cStart);

    // 0. Deep Acoustic-Phonetic Fingerprinting (F1/F2 vowel sequence + true acoustic syllable count)
    const clusterSlices: PhoneticClusterSlice[] = [];
    for (let ci = firstClusterIdx; ci <= lastClusterIdx; ci++) {
      clusterSlices.push({
        bars: clusters[ci].bars,
        startMs: clusters[ci].startMs,
        endMs: clusters[ci].endMs,
      });
    }
    const phonetic = evaluatePhoneticMatch ? evaluatePhoneticMatch(tokens, clusterSlices) : null;
    let precomputedSyllables = 0;
    for (let ci = firstClusterIdx; ci <= lastClusterIdx; ci++) {
      precomputedSyllables += clusters[ci].acousticSyllableCount ?? clusters[ci].bars.length;
    }
    const voicedBarDur = combinedBars.reduce((s, b) => s + b.durationMs, 0);
    const isRapOrLegato = bCnt <= 2 && wCnt >= 6 && cDur >= wCnt * 145 && cDur <= wCnt * 580;
    const durSyllableCap = isRapOrLegato
      ? Math.min(wCnt, Math.max(bCnt, Math.round(Math.max(voicedBarDur, cDur * 0.78) / 200)))
      : bCnt;
    const effectiveUnits =
      phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
        ? Math.max(bCnt, phonetic.acousticSyllableCount, durSyllableCap)
        : Math.max(bCnt, precomputedSyllables, durSyllableCap);
    const hasPhoneticOrAcousticCount =
      Boolean(phonetic?.hasUsableAudio) || precomputedSyllables > bCnt;

    // 1. Word-to-Syllable / NoteBar density mismatch (soften rap/legato phrases where 6+ words share 1-2 continuous bars)
    const rawDensityGap = Math.abs(wCnt - effectiveUnits);
    let densityDiff: number;
    if (hasPhoneticOrAcousticCount && !isRapOrLegato) {
      densityDiff = rawDensityGap * 1.25;
    } else if (isRapOrLegato) {
      densityDiff = Math.min(3.8, rawDensityGap * 0.65);
    } else {
      densityDiff = Math.abs(wCnt - bCnt) * 1.45;
    }

    // 2. Singing duration compatibility
    const expectedSungMs = Math.max(420, wCnt * 265);
    const durRatioDiff = Math.abs(cDur - expectedSungMs) / Math.max(500, expectedSungMs);
    const durPenalty = Math.min(4.2, durRatioDiff * 1.45);

    // 3. Relative progression inside bounded window
    const relL = ((firstLineIdx + lastLineIdx) / 2 + 0.5) / nL;
    const relC = ((firstClusterIdx + lastClusterIdx) / 2 + 0.5) / nC;
    const relPosCost = Math.abs(relL - relC) * (useTimestampPrior ? 2.8 : 5.2);

    // 4. Local shifted-timestamp consistency (bounded so local +1.5..2.0s LRC drift still recovers via density+phonetics+tone!)
    let timeCost = 0;
    const refTime = lines[firstLineIdx].timeMs;
    if (useTimestampPrior && typeof refTime === 'number' && Number.isFinite(refTime)) {
      const dist = Math.abs(cStart - refTime);
      if (dist <= 550) {
        timeCost = -1.75 * (1 - dist / 550);
      } else {
        timeCost = Math.min(4.6, (dist - 550) / 420);
      }
    } else if (!useTimestampPrior && nL === nC && nL >= 2) {
      // Weak window progression fallback
      const expectedStart = windowStartMs + (firstLineIdx / nL) * winSpanMs;
      timeCost = Math.min(2.2, Math.abs(cStart - expectedStart) / Math.max(2500, winSpanMs * 0.45));
    }

    // 5. Breath-pause alignment bonus (if last line & last cluster both end right before long pauses)
    const lrcGap = lines[lastLineIdx].postGapMs ?? 2000;
    const clusterGap = clusters[lastClusterIdx].postGapMs ?? 1000;
    const lrcHasBreath = lrcGap >= 3200;
    const audioHasBreath = clusterGap >= 800;
    const breathBonus = lrcHasBreath && audioHasBreath ? -1.2 : 0;

    // 6. Vietnamese Tone-Melody Concordance (acoustic-linguistic tiebreaker!)
    let toneCost = 0;
    if (wCnt >= 3 && bCnt >= 2) {
      const sampledMidis = sampleClusterMidisForWords(combinedBars, wCnt);
      const report = computePhraseToneMelodicHarmony(tokens, sampledMidis);
      if (report.totalTransitions >= 2) {
        if (report.overallScorePercent >= 68) {
          toneCost = -1.35 * ((report.overallScorePercent - 60) / 40);
        } else if (report.overallScorePercent < 38) {
          toneCost = 1.45 * ((40 - report.overallScorePercent) / 40);
        }
      }
    }

    const phoneticCost = phonetic?.hasUsableAudio ? phonetic.phoneticBonusCost : 0;

    return densityDiff + durPenalty + relPosCost + timeCost + breathBonus + toneCost + phoneticCost;
  };

  type TransitionTag =
    | 'MATCH_1_1'
    | 'SKIP_CLUSTER'
    | 'SKIP_LINE'
    | 'MERGE_2_LINES'
    | 'MERGE_2_CLUSTERS';

  const dp: number[][] = Array.from({ length: nL + 1 }, () =>
    Array.from({ length: nC + 1 }, () => Infinity)
  );
  const action: (TransitionTag | null)[][] = Array.from({ length: nL + 1 }, () =>
    Array.from({ length: nC + 1 }, () => null as TransitionTag | null)
  );
  dp[0][0] = 0;

  const clusterSkipCost = (cIdx: number): number => {
    const c = clusters[cIdx];
    const cDur = c.endMs - c.startMs;
    const isTinyNoise = c.bars.length <= 1 && cDur < 750;
    return isTinyNoise ? 2.4 : 4.9 + Math.min(3.2, c.bars.length * 0.55);
  };

  const lineSkipCost = (lIdx: number): number => {
    const wCnt = lineWordsList[lIdx].length;
    return 4.6 + Math.min(3.1, wCnt * 0.44);
  };

  for (let l = 0; l <= nL; l++) {
    for (let c = 0; c <= nC; c++) {
      if (l === 0 && c === 0) continue;
      let bestCost = Infinity;
      let bestAct: TransitionTag | null = null;

      // 1. 1-to-1 Match
      if (l >= 1 && c >= 1 && dp[l - 1][c - 1] < Infinity) {
        const cand =
          dp[l - 1][c - 1] + computeMatchCost([l - 1], clusters[c - 1].bars, l - 1, l - 1, c - 1, c - 1);
        if (cand < bestCost) {
          bestCost = cand;
          bestAct = 'MATCH_1_1';
        }
      }

      // 2. Skip Cluster (audio phrase without lyric -> missing_lyric gap / Auto-Gen)
      if (allowClusterSkip && c >= 1 && dp[l][c - 1] < Infinity) {
        const cand = dp[l][c - 1] + clusterSkipCost(c - 1);
        if (cand < bestCost) {
          bestCost = cand;
          bestAct = 'SKIP_CLUSTER';
        }
      }

      // 3. Skip Line (omitted text line)
      if (allowLineSkip && l >= 1 && dp[l - 1][c] < Infinity) {
        const cand = dp[l - 1][c] + lineSkipCost(l - 1);
        if (cand < bestCost) {
          bestCost = cand;
          bestAct = 'SKIP_LINE';
        }
      }

      // 4. Merge 2 Lyric Lines into 1 Audio Cluster (only when cluster has genuine multi-line capacity)
      if (allowMerge2Lines && l >= 2 && c >= 1 && dp[l - 2][c - 1] < Infinity) {
        const prevGap = lines[l - 2].postGapMs ?? 2000;
        const w1 = lineWordsList[l - 2].length;
        const w2 = lineWordsList[l - 1].length;
        const totalWords = w1 + w2;
        const targetCluster = clusters[c - 1];
        const clDur = targetCluster.endMs - targetCluster.startMs;
        const clUnits = targetCluster.acousticSyllableCount ?? targetCluster.bars.length;
        const hasCapacityFor2Lines =
          totalWords <= 6 || clUnits >= Math.max(w1, w2) + 2 || clDur >= totalWords * 190;
        if (prevGap <= 3400 && totalWords <= 18 && hasCapacityFor2Lines) {
          const mergeCost = 2.15 + (clUnits < totalWords * 0.65 ? 2.4 : 0);
          const cand =
            dp[l - 2][c - 1] +
            mergeCost +
            computeMatchCost([l - 2, l - 1], targetCluster.bars, l - 2, l - 1, c - 1, c - 1);
          if (cand < bestCost) {
            bestCost = cand;
            bestAct = 'MERGE_2_LINES';
          }
        }
      }

      // 5. Merge 2 Audio Clusters into 1 Lyric Line (mid-line breath)
      if (allowMerge2Clusters && l >= 1 && c >= 2 && dp[l - 1][c - 2] < Infinity) {
        const gapBetween = clusters[c - 1].startMs - clusters[c - 2].endMs;
        const combinedSpan = clusters[c - 1].endMs - clusters[c - 2].startMs;
        if (gapBetween <= 1300 && combinedSpan <= 6600) {
          const combinedBars = [...clusters[c - 2].bars, ...clusters[c - 1].bars];
          const gapPenalty = 1.25 + Math.max(0, gapBetween - 220) * 0.002;
          const cand =
            dp[l - 1][c - 2] +
            gapPenalty +
            computeMatchCost([l - 1], combinedBars, l - 1, l - 1, c - 2, c - 1);
          if (cand < bestCost) {
            bestCost = cand;
            bestAct = 'MERGE_2_CLUSTERS';
          }
        }
      }

      dp[l][c] = bestCost;
      action[l][c] = bestAct;
    }
  }

  // Backtrack optimal path
  const ops: ISymmetricAlignmentOp[] = [];
  let l = nL;
  let c = nC;

  while (l > 0 || c > 0) {
    const act = action[l][c];
    if (act === 'MATCH_1_1') {
      const ln = lines[l - 1];
      ops.push({
        kind: 'match',
        lineIndices: [l - 1],
        clusterIndices: [c - 1],
        bars: clusters[c - 1].bars,
        text: ln.text,
        timeMs: ln.timeMs,
        wordTimestamps: ln.wordTimestamps,
      });
      l -= 1;
      c -= 1;
    } else if (act === 'SKIP_CLUSTER') {
      ops.push({
        kind: 'skip_cluster',
        lineIndices: [],
        clusterIndices: [c - 1],
        bars: clusters[c - 1].bars,
      });
      c -= 1;
    } else if (act === 'SKIP_LINE') {
      const ln = lines[l - 1];
      ops.push({
        kind: 'skip_line',
        lineIndices: [l - 1],
        clusterIndices: [],
        bars: [],
        text: ln.text,
        timeMs: ln.timeMs,
        wordTimestamps: ln.wordTimestamps,
      });
      l -= 1;
    } else if (act === 'MERGE_2_LINES') {
      const l1 = lines[l - 2];
      const l2 = lines[l - 1];
      const combinedTimestamps =
        l1.wordTimestamps || l2.wordTimestamps
          ? [...(l1.wordTimestamps || []), ...(l2.wordTimestamps || [])]
          : undefined;
      ops.push({
        kind: 'merge_2_lines',
        lineIndices: [l - 2, l - 1],
        clusterIndices: [c - 1],
        bars: clusters[c - 1].bars,
        text: `${l1.text} ${l2.text}`.trim(),
        timeMs: l1.timeMs,
        wordTimestamps: combinedTimestamps,
      });
      l -= 2;
      c -= 1;
    } else if (act === 'MERGE_2_CLUSTERS') {
      const ln = lines[l - 1];
      ops.push({
        kind: 'merge_2_clusters',
        lineIndices: [l - 1],
        clusterIndices: [c - 2, c - 1],
        bars: [...clusters[c - 2].bars, ...clusters[c - 1].bars],
        text: ln.text,
        timeMs: ln.timeMs,
        wordTimestamps: ln.wordTimestamps,
      });
      l -= 1;
      c -= 2;
    } else {
      // Defensive termination if unreachable corner occurred
      if (c > 0) {
        ops.push({
          kind: 'skip_cluster',
          lineIndices: [],
          clusterIndices: [c - 1],
          bars: clusters[c - 1].bars,
        });
        c -= 1;
      } else if (l > 0) {
        ops.push({
          kind: 'skip_line',
          lineIndices: [l - 1],
          clusterIndices: [],
          bars: [],
          text: lines[l - 1].text,
          timeMs: lines[l - 1].timeMs,
          wordTimestamps: lines[l - 1].wordTimestamps,
        });
        l -= 1;
      }
    }
  }

  ops.reverse();
  return ops;
}

export interface IPhraseSlotDraft {
  lrcIndices: number[]; // empty when isMissingGap === true
  bars: IVocalNoteBar[];
  lyricText?: string;
  shiftedTimeMs?: number;
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  isMissingGap: boolean;
  isRecoveredByDp?: boolean;
}

/**
 * Evaluate the alignment quality of a phrase-slot array locally against unsplit NoteBars.
 */
function scoreSlotWindowQuality(
  slots: IPhraseSlotDraft[],
  useTimeCheck: boolean,
  evaluatePhoneticMatch?: PhoneticEvaluationFn
): number {
  let score = 0;
  for (const s of slots) {
    if (s.isMissingGap) {
      // Missing gap containing substantial singing notes has modest penalty; clean auto-gen later handles it
      score -= s.bars.length > 0 ? 0.5 : 3.0;
      continue;
    }
    const tokens = (s.lyricText || '').trim().split(/\s+/).filter(Boolean);
    const wCnt = Math.max(1, tokens.length);
    const bCnt = s.bars.length;
    if (bCnt === 0) {
      score -= 4.5;
      continue;
    }

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

    const densityMismatch = Math.abs(wCnt - effectiveUnits);
    const cDur = Math.max(150, s.bars[bCnt - 1].endTimeMs - s.bars[0].startTimeMs);
    const legatoDurValid = bCnt <= 2 && wCnt >= 6 && cDur >= wCnt * 145 && cDur <= wCnt * 580;
    const severeDensity =
      (!phonetic?.hasUsableAudio &&
        !legatoDurValid &&
        ((wCnt >= 4 && bCnt <= 1) || (wCnt >= 3 && bCnt / wCnt < 0.35))) ||
      (bCnt >= 8 && bCnt / wCnt >= 3.2);

    let localScore = 3.5 + Math.min(4.0, effectiveUnits * 0.4) - densityMismatch * 0.45;
    if (severeDensity) localScore -= 2.8;

    if (useTimeCheck && typeof s.shiftedTimeMs === 'number') {
      const dt = Math.abs(s.bars[0].startTimeMs - s.shiftedTimeMs);
      localScore += dt <= 650 ? 1.1 : -Math.min(2.3, (dt - 650) / 720);
    }

    if (wCnt >= 4 && bCnt >= 3) {
      const sampled = sampleClusterMidisForWords(s.bars, wCnt);
      const report = computePhraseToneMelodicHarmony(tokens, sampled);
      if (report.overallScorePercent < 38) localScore -= 1.2;
      else if (report.overallScorePercent >= 70) localScore += 0.8;
    }

    if (phonetic?.hasUsableAudio) {
      localScore -= phonetic.phoneticBonusCost * 0.85;
    }

    score += localScore;
  }
  return score;
}

/**
 * Anchor-Constrained Local Island Repair (`repairDamagedPhraseWindowsLocally`):
 * Isolates localized cascade shifts, empty LRC lines, density crashes, or uncovered gap phrases strictly
 * between high-confidence Anchor Islands (`leftAnchor` ... `rightAnchor`), solving ONLY inside each
 * damaged window using `alignWindowSymmetricDP` so surrounding verified anchors never shift.
 */
export function repairDamagedPhraseWindowsLocally(params: {
  initialSlots: IPhraseSlotDraft[];
  shiftedLines: Array<{
    timeMs: number;
    text: string;
    wordTimestamps?: Array<{ timeMs: number; text: string }>;
  }>;
  cleanOriginalBars: IVocalNoteBar[];
  evaluatePhoneticMatch?: PhoneticEvaluationFn;
}): IPhraseSlotDraft[] {
  const { initialSlots, shiftedLines, cleanOriginalBars, evaluatePhoneticMatch } = params;
  if (initialSlots.length === 0 || shiftedLines.length === 0 || cleanOriginalBars.length === 0) {
    return initialSlots;
  }

  const N = initialSlots.length;
  const L = shiftedLines.length;
  const firstAudioBarMs = cleanOriginalBars[0].startTimeMs;
  const lastAudioBarMs = cleanOriginalBars[cleanOriginalBars.length - 1].endTimeMs;

  // Separate out inactive trailing empty LRC slots that sit strictly past the end of the audio recording
  // (e.g. a 35s audio preview paired with a full 4-minute LRC) so they never trigger whole-song rewriting.
  let activeEndIdx = N - 1;
  while (
    activeEndIdx > 0 &&
    !initialSlots[activeEndIdx].isMissingGap &&
    initialSlots[activeEndIdx].bars.length === 0 &&
    (initialSlots[activeEndIdx].shiftedTimeMs ?? 0) > lastAudioBarMs + 1500
  ) {
    activeEndIdx--;
  }
  const trailingInactiveTail = initialSlots.slice(activeEndIdx + 1);
  const activeSlots = initialSlots.slice(0, activeEndIdx + 1);
  const activeN = activeSlots.length;
  const hasAnyMissingGapInActive = activeSlots.some((s) => s.isMissingGap);

  // Compute strict Anchor Island strength for each active slot
  const slotQuality = activeSlots.map((slot) => {
    if (slot.isMissingGap || slot.lrcIndices.length === 0) {
      return { isStrongAnchor: false, isMarginalAnchor: false };
    }
    const bCnt = slot.bars.length;
    if (bCnt === 0) {
      return { isStrongAnchor: false, isMarginalAnchor: false };
    }
    const tokens = (slot.lyricText || '').trim().split(/\s+/).filter(Boolean);
    const wCnt = Math.max(1, tokens.length);
    const phonetic = evaluatePhoneticMatch
      ? evaluatePhoneticMatch(tokens, [
          {
            bars: slot.bars,
            startMs: slot.bars[0].startTimeMs,
            endMs: slot.bars[slot.bars.length - 1].endTimeMs,
          },
        ])
      : null;

    const effectiveUnits =
      phonetic?.hasUsableAudio && phonetic.acousticSyllableCount
        ? Math.max(bCnt, phonetic.acousticSyllableCount)
        : bCnt;
    const ratio = effectiveUnits / wCnt;
    const slotDurMs = Math.max(150, slot.bars[bCnt - 1].endTimeMs - slot.bars[0].startTimeMs);

    const timingOk =
      typeof slot.shiftedTimeMs !== 'number' ||
      Math.abs(slot.bars[0].startTimeMs - slot.shiftedTimeMs) <= 1150;
    const timingTight =
      typeof slot.shiftedTimeMs !== 'number' ||
      Math.abs(slot.bars[0].startTimeMs - slot.shiftedTimeMs) <= 500;
    const legatoCoversWords =
      bCnt <= 2 && wCnt >= 6 && slotDurMs >= wCnt * 145 && slotDurMs <= wCnt * 580;

    let toneInverted = false;
    if (wCnt >= 5 && bCnt >= 3) {
      const sampled = sampleClusterMidisForWords(slot.bars, wCnt);
      const report = computePhraseToneMelodicHarmony(tokens, sampled);
      if (report.overallScorePercent < 40) toneInverted = true;
    }

    const phoneticContradicted = Boolean(
      phonetic?.hasUsableAudio && phonetic.phoneticBonusCost >= 1.55
    );
    const phoneticSupported = Boolean(
      phonetic?.hasUsableAudio && phonetic.phoneticBonusCost <= -0.15
    );

    const densityHealthy =
      wCnt <= 2
        ? effectiveUnits >= 1 && effectiveUnits <= 4
        : (ratio >= 0.48 && ratio <= 2.25) ||
          (phoneticSupported && ratio >= 0.35 && ratio <= 2.4) ||
          (legatoCoversWords && !phoneticContradicted);
    const densityTight =
      wCnt <= 2 ? effectiveUnits >= 1 && effectiveUnits <= 3 : ratio >= 0.65 && ratio <= 1.75;

    // Preserve a lone valid active slot whose timing already matches when no missing gaps compete
    const isSoleMatchedSnippetSlot =
      activeN === 1 &&
      trailingInactiveTail.length > 0 &&
      Math.abs((slot.shiftedTimeMs ?? slot.bars[0].startTimeMs) - slot.bars[0].startTimeMs) <= 3200;

    if (isSoleMatchedSnippetSlot) {
      return { isStrongAnchor: true, isMarginalAnchor: false };
    }

    if (!densityHealthy || !timingOk || toneInverted || phoneticContradicted) {
      return { isStrongAnchor: false, isMarginalAnchor: false };
    }
    return {
      isStrongAnchor: true,
      isMarginalAnchor: !densityTight || !timingTight,
    };
  });

  // Identify contiguous damaged spans of slots [s .. e] within active audio bounds
  const working: IPhraseSlotDraft[] = [];
  let cursor = 0;

  while (cursor < activeN) {
    if (slotQuality[cursor].isStrongAnchor) {
      working.push(activeSlots[cursor]);
      cursor++;
      continue;
    }

    // Found non-anchor damaged slot: find end of contiguous non-anchor region
    let winEnd = cursor;
    while (winEnd + 1 < activeN && !slotQuality[winEnd + 1].isStrongAnchor) {
      winEnd++;
    }

    // Expand boundary by at most 1 marginal neighbor anchor if a density/timing steal occurred at the seam
    let winStart = cursor;
    if (winStart > 0 && slotQuality[winStart - 1].isMarginalAnchor && working.length > 0) {
      working.pop();
      winStart--;
    }
    if (winEnd + 1 < activeN && slotQuality[winEnd + 1].isMarginalAnchor) {
      winEnd++;
    }

    const leftAnchor = winStart > 0 ? working[working.length - 1] : null;
    const rightAnchor = winEnd + 1 < activeN ? activeSlots[winEnd + 1] : null;

    const minLrcIdx =
      leftAnchor && leftAnchor.lrcIndices.length > 0
        ? Math.max(...leftAnchor.lrcIndices) + 1
        : 0;
    let maxLrcIdx =
      rightAnchor && rightAnchor.lrcIndices.length > 0
        ? Math.min(...rightAnchor.lrcIndices) - 1
        : L - 1;

    // If audio is just an opening snippet with no missing gaps, bound LRC search to active audio range
    if (!rightAnchor && !hasAnyMissingGapInActive && trailingInactiveTail.length > 0) {
      const lastActiveLrc = activeSlots[activeN - 1]?.lrcIndices;
      if (lastActiveLrc && lastActiveLrc.length > 0) {
        maxLrcIdx = Math.min(maxLrcIdx, Math.max(...lastActiveLrc));
      }
    }

    const minBarMs =
      leftAnchor && leftAnchor.bars.length > 0
        ? leftAnchor.bars[leftAnchor.bars.length - 1].endTimeMs + 1
        : -Infinity;
    const maxBarMs =
      rightAnchor && rightAnchor.bars.length > 0
        ? rightAnchor.bars[0].startTimeMs - 1
        : Infinity;

    const origSlice = activeSlots.slice(winStart, winEnd + 1);
    const windowBars = cleanOriginalBars.filter((b) => {
      const mid = (b.startTimeMs + b.endTimeMs) / 2;
      return mid >= minBarMs && mid <= maxBarMs;
    });

    if (minLrcIdx > maxLrcIdx || windowBars.length === 0) {
      working.push(...origSlice);
      cursor = winEnd + 1;
      continue;
    }

    const windowLrcIndices: number[] = [];
    for (let li = minLrcIdx; li <= maxLrcIdx; li++) {
      windowLrcIndices.push(li);
    }

    const rawClusters = clusterNoteBarsBySilence(windowBars, 380, 6200);
    const filteredClusters =
      rawClusters.length > windowLrcIndices.length
        ? rawClusters.filter((c) => c.length >= 2 || c[0].durationMs >= 190)
        : rawClusters;
    const avgWordsInWindow =
      windowLrcIndices.reduce(
        (acc, li) => acc + Math.max(1, shiftedLines[li].text.trim().split(/\s+/).filter(Boolean).length),
        0
      ) / Math.max(1, windowLrcIndices.length);
    const localClusters = expandClustersTowardCount(
      filteredClusters.length > 0 ? filteredClusters : rawClusters,
      windowLrcIndices.length,
      avgWordsInWindow
    );

    const winStartMs = windowBars[0].startTimeMs;
    const winEndMs = windowBars[windowBars.length - 1].endTimeMs;

    const symLines: ISymmetricLyricInput[] = windowLrcIndices.map((li) => ({
      text: shiftedLines[li].text,
      timeMs: shiftedLines[li].timeMs,
      postGapMs:
        li + 1 < L ? Math.max(0, shiftedLines[li + 1].timeMs - shiftedLines[li].timeMs) : 2500,
      wordTimestamps: shiftedLines[li].wordTimestamps,
      originalLineIdx: li,
    }));

    const symClusters: ISymmetricClusterInput[] = localClusters.map((bars, idx) => ({
      bars,
      startMs: bars[0].startTimeMs,
      endMs: bars[bars.length - 1].endTimeMs,
      postGapMs:
        idx + 1 < localClusters.length
          ? Math.max(0, localClusters[idx + 1][0].startTimeMs - bars[bars.length - 1].endTimeMs)
          : 2000,
      originalClusterIdx: idx,
    }));

    // Check if local LRC timestamps fall reasonably near the bounded audio window
    const inBoundTimeLines = symLines.filter(
      (sl) =>
        typeof sl.timeMs === 'number' &&
        sl.timeMs >= winStartMs - 2000 &&
        sl.timeMs <= winEndMs + 2000
    ).length;
    const useLocalTimePrior = symLines.length > 0 && inBoundTimeLines / symLines.length >= 0.5;

    const ops = alignWindowSymmetricDP({
      lines: symLines,
      clusters: symClusters,
      windowStartMs: winStartMs,
      windowEndMs: winEndMs,
      useTimestampPrior: useLocalTimePrior,
      allowLineSkip: true,
      allowClusterSkip: true,
      allowMerge2Lines: true,
      allowMerge2Clusters: true,
      evaluatePhoneticMatch,
    });

    const repairedSlots: IPhraseSlotDraft[] = [];
    for (const op of ops) {
      if (op.kind === 'skip_line') continue;
      if (op.kind === 'skip_cluster') {
        const cDur = op.bars[op.bars.length - 1].endTimeMs - op.bars[0].startTimeMs;
        const isBeforeFirstWindowLrc =
          winStart === 0 && symLines[0]?.timeMs !== undefined && op.bars[op.bars.length - 1].endTimeMs < symLines[0].timeMs - 150;
        const distinctMidis = new Set(op.bars.map((b) => b.midi));
        const isGenuineSinging =
          (!isBeforeFirstWindowLrc || (op.bars.length >= 2 && distinctMidis.size >= 2)) &&
          ((op.bars.length >= 2 && cDur >= 650) || (op.bars.length === 1 && cDur >= 900));
        if (isGenuineSinging) {
          repairedSlots.push({
            lrcIndices: [],
            bars: op.bars,
            isMissingGap: true,
            isRecoveredByDp: false,
          });
        }
        continue;
      }

      repairedSlots.push({
        lrcIndices: op.lineIndices.map((idx) => windowLrcIndices[idx]),
        bars: op.bars,
        lyricText: op.text,
        shiftedTimeMs: op.timeMs,
        wordTimestamps: op.wordTimestamps,
        isMissingGap: false,
        isRecoveredByDp: true,
      });
    }

    const origScore = scoreSlotWindowQuality(origSlice, useLocalTimePrior, evaluatePhoneticMatch);
    const repairedScore = scoreSlotWindowQuality(repairedSlots, useLocalTimePrior, evaluatePhoneticMatch);
    const origMatchedCount = origSlice.filter((s) => !s.isMissingGap && s.bars.length > 0).length;
    const repMatchedCount = repairedSlots.filter((s) => !s.isMissingGap && s.bars.length > 0).length;

    const acceptRepair =
      repairedSlots.length > 0 &&
      (repairedScore > origScore + 0.35 ||
        (repMatchedCount > origMatchedCount && repairedScore >= origScore - 0.55));

    working.push(...(acceptRepair ? repairedSlots : origSlice));
    cursor = winEnd + 1;
  }

  // Filter out any trailing empty slot whose LRC line(s) were already re-assigned inside a repaired window
  const handledLrcIndices = new Set<number>();
  for (const wSlot of working) {
    wSlot.lrcIndices.forEach((li) => handledLrcIndices.add(li));
  }
  const survivingTail = trailingInactiveTail.filter(
    (tSlot) =>
      tSlot.lrcIndices.length === 0 ||
      tSlot.lrcIndices.every((li) => !handledLrcIndices.has(li) && li > Math.max(-1, ...handledLrcIndices))
  );

  void firstAudioBarMs;
  return [...working, ...survivingTail];
}
