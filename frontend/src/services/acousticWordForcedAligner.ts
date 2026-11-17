/**
 * Anchor-Pinned 2-State (CTC-Blank Silence + Syllable-Nucleus) Word Forced Aligner
 * (`acousticWordForcedAligner.ts`)
 *
 * Eliminates word-level domino cascades inside a phrase ("1 chữ bị lệch -> cả câu trôi theo") by:
 * 1. Introducing an explicit `SIL / GAP` absorbing state via O(1) prefix sums (`cumSilCost`),
 *    so intra-phrase breaths, plosive closures, and pauses are absorbed cleanly instead of swelling words.
 * 2. Detecting genuine Vocal Syllable Nuclei & Deep Inter-Syllable Valleys (`cumStrongValleys`),
 *    penalizing non-melisma words that swallow >=2 distinct syllable peaks.
 * 3. Partitioning phrases at high-confidence Sub-Clause Punctuation <-> Breath-Pause Anchors &
 *    Enhanced LRC `wordTimestamps`, then solving unconstrained sustained durations independently per island.
 * 4. Running a local Outlier Word Rescue post-pass that snaps any weak-energy word onto adjacent
 *    uncovered syllable peaks without disturbing verified neighbor anchors.
 */

import type {
  IReferencePitchPoint,
  IVocalNoteBar,
  IVocalPhrase,
} from './vocalFileAnalysisService';

export interface IForcedAlignWordItem {
  wordIndex: number;
  text: string;
  solfege: string;
  noteName: string;
  midi: number;
  startMs: number;
  endMs: number;
  durationMs?: number;
  vowelHint?: IVocalNoteBar['vowelHint'];
  sustainCoreMs?: number;
  sustainKind?: 'steady_hold' | 'vibrato_hold' | 'melisma_glide' | 'clipped';
  noteSequence?: string[];
  solfegeSequence?: string[];
  melismaNotesCount?: number;
  stepSemitones?: number;
}

export interface IAcousticAlignerDeps {
  goertzelBandEnergy: (
    samples: Float32Array,
    startIdx: number,
    length: number,
    sampleRate: number,
    targetHz: number
  ) => number;
  computeOralToNasalRatioDbAtMs: (
    rawMonoPcm: Float32Array | null | undefined,
    sampleRate: number,
    timeMs: number,
    avoidF0Hz?: number
  ) => number;
  computeWordIntrinsicDurationWeight: (rawWord: string, isPhraseFinal?: boolean) => number;
  decomposeVietnameseWordPhoneticStates: (rawWord: string) => {
    onsetState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
    nucleusState: string;
    codaState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
  };
  extractVietnameseWordVowel: (rawWord: string) => {
    isCheckedStop: boolean;
  } | null;
  extractVietnameseToneContour: (rawWord: string) => 'rising' | 'falling' | 'dipping' | 'level';
  computeWordAcousticStats: (
    wStart: number,
    wEnd: number,
    pitchTrack: IReferencePitchPoint[],
    fallbackMidi: number,
    isCheckedStop: boolean,
    melismaNotesCount: number
  ) => {
    midi: number;
    exactMidi: number;
    noteName: string;
    solfege: string;
    sustainCoreMs: number;
    sustainKind?: 'steady_hold' | 'vibrato_hold' | 'melisma_glide' | 'clipped';
  };
  getPhraseNoteBarsStrict: (phrase: IVocalPhrase, allNoteBars: IVocalNoteBar[]) => IVocalNoteBar[];
  splitSingleBarAtMs: (
    workingBars: IVocalNoteBar[],
    allNoteBars: IVocalNoteBar[],
    barIdx: number,
    splitMs: number,
    pitchTrack: IReferencePitchPoint[]
  ) => void;
}

interface IAnchorSegment {
  wStart: number;
  wEnd: number;
  fStart: number;
  fEnd: number;
}

/**
 * Partition word range `[0..W-1]` and frame range `[0..T]` at unambiguous internal pause <-> punctuation
 * landmarks so errors in clause 1 cannot leak across a comma/semicolon pause into clause 2.
 */
function discoverClauseAnchorSegments(params: {
  rawTokens: string[];
  activity: Float64Array;
  formantFlux: Float64Array;
  rmsDip: Float64Array;
  barOnsetBonus: Float64Array;
  stepMs: number;
  baseStartMs: number;
  T: number;
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  wordWeights: number[];
}): IAnchorSegment[] {
  const {
    rawTokens,
    activity,
    formantFlux,
    rmsDip,
    barOnsetBonus,
    stepMs,
    baseStartMs,
    T,
    wordTimestamps,
    wordWeights,
  } = params;
  const W = rawTokens.length;
  if (W < 4 || T < 16) {
    return [{ wStart: 0, wEnd: W - 1, fStart: 0, fEnd: T }];
  }

  // Build cumulative active energy to validate punctuation/timestamp anchor proportions
  const cumActive = new Float64Array(T + 1);
  for (let t = 0; t < T; t++) cumActive[t + 1] = cumActive[t] + activity[t];
  const totalAct = Math.max(1, cumActive[T]);
  const totalW = Math.max(1, wordWeights.reduce((s, w) => s + w, 0));
  const cumWordFrac: number[] = [];
  let acc = 0;
  for (let w = 0; w < W; w++) {
    acc += wordWeights[w];
    cumWordFrac.push(acc / totalW);
  }

  const splits: Array<{ wAfter: number; fSplit: number }> = [];

  // 1. Sub-clause Punctuation <-> Internal Breath Pause Anchor Matching
  const punctuationIndices: number[] = [];
  for (let w = 1; w <= W - 3; w++) {
    if (/[,;?!…]$/.test(rawTokens[w].trim())) {
      punctuationIndices.push(w);
    }
  }

  if (punctuationIndices.length > 0) {
    const minPauseFrames = Math.max(4, Math.round(85 / stepMs));
    const internalPauses: Array<{ startK: number; endK: number; midK: number; lenK: number }> = [];
    let runStart = -1;
    for (let k = 3; k < T - 3; k++) {
      if (activity[k] <= 0.22) {
        if (runStart < 0) runStart = k;
      } else if (runStart >= 0) {
        const len = k - runStart;
        if (len >= minPauseFrames) {
          internalPauses.push({ startK: runStart, endK: k, midK: Math.round((runStart + k) / 2), lenK: len });
        }
        runStart = -1;
      }
    }
    if (runStart >= 0 && T - 3 - runStart >= minPauseFrames) {
      const endK = T - 3;
      internalPauses.push({ startK: runStart, endK, midK: Math.round((runStart + endK) / 2), lenK: endK - runStart });
    }

    let lastW = -1;
    let lastF = 3;
    for (const wIdx of punctuationIndices) {
      if (wIdx <= lastW + 1 || W - 1 - wIdx < 2) continue;
      const expectedActFrac = cumWordFrac[wIdx];

      let bestPause: (typeof internalPauses)[number] | null = null;
      let bestScore = -Infinity;
      for (const p of internalPauses) {
        if (p.startK <= lastF + (wIdx - lastW) * 2) continue;
        if (T - p.endK < (W - 1 - wIdx) * 2) continue;
        const fracDiff = Math.abs(cumActive[p.midK] / totalAct - expectedActFrac);
        if (fracDiff > 0.24) continue;
        const score = p.lenK * 0.6 - fracDiff * 28;
        if (score > bestScore) {
          bestScore = score;
          bestPause = p;
        }
      }
      if (bestPause && bestScore > 0) {
        splits.push({ wAfter: wIdx, fSplit: bestPause.midK });
        lastW = wIdx;
        lastF = bestPause.endK;
      }
    }
  }

  // 2. High-Confidence Enhanced LRC WordTimestamp <-> Acoustic Onset Hard Pins
  if (splits.length === 0 && wordTimestamps && wordTimestamps.length >= W && W >= 6) {
    const midIdx = Math.floor(W / 2);
    const tsMs = wordTimestamps[midIdx]?.timeMs;
    if (tsMs && Number.isFinite(tsMs)) {
      const estK = Math.round((tsMs - baseStartMs) / stepMs);
      if (estK >= midIdx * 2 && T - estK >= (W - midIdx) * 2) {
        let bestOnsetK = -1;
        let bestOnsetScore = 1.6;
        const rad = Math.round(130 / stepMs);
        for (let k = Math.max(midIdx * 2, estK - rad); k <= Math.min(T - (W - midIdx) * 2, estK + rad); k++) {
          const onsetScore = formantFlux[k] * 1.1 + rmsDip[k] * 0.7 + barOnsetBonus[k];
          if (onsetScore > bestOnsetScore) {
            bestOnsetScore = onsetScore;
            bestOnsetK = k;
          }
        }
        if (bestOnsetK >= 0) {
          splits.push({ wAfter: midIdx - 1, fSplit: bestOnsetK });
        }
      }
    }
  }

  if (splits.length === 0) {
    return [{ wStart: 0, wEnd: W - 1, fStart: 0, fEnd: T }];
  }

  const segments: IAnchorSegment[] = [];
  let curWStart = 0;
  let curFStart = 0;
  for (const sp of splits) {
    segments.push({ wStart: curWStart, wEnd: sp.wAfter, fStart: curFStart, fEnd: sp.fSplit });
    curWStart = sp.wAfter + 1;
    curFStart = sp.fSplit;
  }
  segments.push({ wStart: curWStart, wEnd: W - 1, fStart: curFStart, fEnd: T });
  return segments;
}

/**
 * Acoustic-Phonetic 2-State (`SIL` + `WORD`) Anchor-Pinned Forced Aligner:
 * Aligns `words[0..W-1]` to real modulated vocal PCM frames `[0..T]` with explicit silence/gap
 * absorption and syllable-peak integrity so one misplaced/stretched word never cascades downstream.
 */
export function runAcousticWordForcedAlignment(params: {
  phrase: IVocalPhrase;
  phraseBars: IVocalNoteBar[];
  allNoteBars: IVocalNoteBar[];
  words: IForcedAlignWordItem[];
  rawTokens: string[];
  rawMonoPcm: Float32Array;
  sampleRate: number;
  pitchTrack: IReferencePitchPoint[];
  wordTimestamps?: Array<{ timeMs: number; text: string }>;
  splitNoteBarsToMatch?: boolean;
  deps: IAcousticAlignerDeps;
}): void {
  const {
    phrase,
    phraseBars,
    allNoteBars,
    words,
    rawTokens,
    rawMonoPcm,
    sampleRate,
    pitchTrack,
    wordTimestamps,
    splitNoteBarsToMatch = true,
    deps,
  } = params;

  const W = rawTokens.length;
  if (
    W < 2 ||
    words.length !== W ||
    phraseBars.length === 0 ||
    !rawMonoPcm ||
    rawMonoPcm.length < 512
  ) {
    return;
  }

  const baseStartMs = Math.max(0, phraseBars[0].startTimeMs - 45);
  const baseEndMs = phraseBars[phraseBars.length - 1].endTimeMs + 45;
  const totalSpanMs = baseEndMs - baseStartMs;
  if (totalSpanMs < W * 55) return;

  const sIdxStart = Math.max(0, Math.floor((baseStartMs / 1000) * sampleRate));
  const sIdxEnd = Math.min(rawMonoPcm.length, Math.ceil((baseEndMs / 1000) * sampleRate));
  if (sIdxEnd - sIdxStart < 512) return;

  let peakAbs = 0;
  for (let i = sIdxStart; i < sIdxEnd; i += 4) {
    const a = Math.abs(rawMonoPcm[i]);
    if (a > peakAbs) peakAbs = a;
  }
  if (peakAbs < 0.005) return;

  // Frame grid: 15ms step (adaptive for long >6.75s phrases so T <= 450)
  const stepMs = Math.max(15, Math.ceil(totalSpanMs / 450));
  const T = Math.max(W * 3, Math.round(totalSpanMs / stepMs));
  const winLen = Math.min(1024, Math.max(256, Math.round(sampleRate * 0.024)));

  const energyDb = new Float64Array(T);
  const smoothEnergyDb = new Float64Array(T);
  const hfRatioDb = new Float64Array(T);
  const oralNasalDb = new Float64Array(T);
  const bVec = Array.from({ length: T }, () => new Float64Array(4));
  const frameMidis = new Float64Array(T);

  const vocalBands = [360, 720, 1250, 2100];
  let ptCursor = 0;
  let maxDb = -120;
  let minDb = 0;

  for (let t = 0; t < T; t++) {
    const tMs = baseStartMs + (t + 0.5) * stepMs;
    const centerSample = Math.round((tMs / 1000) * sampleRate);
    const startSample = Math.max(
      0,
      Math.min(rawMonoPcm.length - winLen, centerSample - Math.floor(winLen / 2))
    );

    let sumBandE = 0;
    for (let m = 0; m < 4; m++) {
      const e = deps.goertzelBandEnergy(rawMonoPcm, startSample, winLen, sampleRate, vocalBands[m]);
      bVec[t][m] = e;
      sumBandE += e;
    }
    const eps = 1e-12;
    for (let m = 0; m < 4; m++) {
      bVec[t][m] /= sumBandE + eps;
    }

    const eDb = 10 * Math.log10(sumBandE / 4 + eps);
    energyDb[t] = eDb;
    if (eDb > maxDb) maxDb = eDb;
    if (eDb < minDb) minDb = eDb;

    const hfE =
      (deps.goertzelBandEnergy(rawMonoPcm, startSample, winLen, sampleRate, 3000) +
        deps.goertzelBandEnergy(rawMonoPcm, startSample, winLen, sampleRate, 4400)) *
      0.5;
    const lowE = (bVec[t][0] * sumBandE + bVec[t][1] * sumBandE) * 0.5;
    hfRatioDb[t] = 10 * Math.log10((hfE + eps) / (lowE + eps));

    while (ptCursor + 1 < pitchTrack.length && pitchTrack[ptCursor + 1].timeMs <= tMs) {
      ptCursor++;
    }
    const curPt = pitchTrack[ptCursor];
    const frameF0 =
      curPt && curPt.isVocal && curPt.freqHz > 140 && Math.abs(curPt.timeMs - tMs) <= 45
        ? curPt.freqHz
        : undefined;
    frameMidis[t] =
      curPt && curPt.isVocal && curPt.midi > 0 && Math.abs(curPt.timeMs - tMs) <= 45
        ? curPt.midi
        : 0;
    oralNasalDb[t] = deps.computeOralToNasalRatioDbAtMs(rawMonoPcm, sampleRate, tMs, frameF0);
  }

  // Require real modulated vocal energy envelope (>= 4.5dB dynamic range)
  if (maxDb - minDb < 4.5) return;

  for (let t = 0; t < T; t++) {
    const prev = t > 0 ? energyDb[t - 1] : energyDb[t];
    const next = t + 1 < T ? energyDb[t + 1] : energyDb[t];
    smoothEnergyDb[t] = prev * 0.25 + energyDb[t] * 0.5 + next * 0.25;
  }

  const formantFlux = new Float64Array(T);
  const rmsDip = new Float64Array(T);
  const hfRise = new Float64Array(T);
  const nasalDip = new Float64Array(T);
  const pitchVel = new Float64Array(T);
  const barOnsetBonus = new Float64Array(T);
  const activity = new Float64Array(T);

  for (let b = 0; b < phraseBars.length; b++) {
    const barF = Math.round((phraseBars[b].startTimeMs - baseStartMs) / stepMs);
    for (let d = -1; d <= 1; d++) {
      if (barF + d >= 0 && barF + d < T) {
        barOnsetBonus[barF + d] = Math.max(barOnsetBonus[barF + d], d === 0 ? 5.0 : 2.8);
      }
    }
  }

  for (let t = 0; t < T; t++) {
    const tMs = baseStartMs + (t + 0.5) * stepMs;
    const relDb = smoothEnergyDb[t] - maxDb;
    const inBar = phraseBars.some((b) => tMs >= b.startTimeMs - 15 && tMs <= b.endTimeMs + 15);
    const act =
      relDb >= -18 ? 0.5 + 0.5 * Math.min(1, (relDb + 18) / 14) : inBar ? 0.30 : 0.05;
    activity[t] = act;

    if (t >= 1 && t < T - 1) {
      let flux = 0;
      for (let m = 0; m < 4; m++) {
        flux += Math.abs(bVec[t + 1][m] - bVec[t - 1][m]);
      }
      formantFlux[t] = flux * 5.0;

      const leftE =
        t >= 2 ? Math.max(smoothEnergyDb[t - 1], smoothEnergyDb[t - 2]) : smoothEnergyDb[t - 1];
      const rightE =
        t + 2 < T ? Math.max(smoothEnergyDb[t + 1], smoothEnergyDb[t + 2]) : smoothEnergyDb[t + 1];
      rmsDip[t] = Math.max(0, Math.min(leftE, rightE) - smoothEnergyDb[t]);

      const prevHf = t >= 2 ? Math.min(hfRatioDb[t - 1], hfRatioDb[t - 2]) : hfRatioDb[t - 1];
      hfRise[t] = Math.max(0, hfRatioDb[t] - prevHf);

      nasalDip[t] = Math.max(
        0,
        Math.min(oralNasalDb[t - 1], oralNasalDb[t + 1]) - oralNasalDb[t]
      );

      if (frameMidis[t + 1] > 0 && frameMidis[t - 1] > 0) {
        pitchVel[t] = Math.min(5.0, Math.abs(frameMidis[t + 1] - frameMidis[t - 1]) * 1.4);
      }
    }
  }

  const cumActivity = new Float64Array(T + 1);
  const cumSilCost = new Float64Array(T + 1);
  const valleySignal = new Float64Array(T);
  const cumStrongValleys = new Float64Array(T + 1);

  for (let t = 0; t < T; t++) {
    cumActivity[t + 1] = cumActivity[t] + activity[t];

    // Explicit SIL / GAP transition cost per frame:
    // Quiet breaths & deep consonant closures can be skipped near-free so one pause doesn't cascade!
    // Skipping high-energy active vowel cores incurs a clear vocal-missed penalty.
    const act = activity[t];
    const silCost =
      act <= 0.16
        ? -0.10
        : act <= 0.34
        ? 0.06
        : 0.48 + (act - 0.34) * 4.2;
    cumSilCost[t + 1] = cumSilCost[t] + silCost;

    // Inter-syllable valley detector: bimodal RMS dip, deep nasal murmur dip, or crisp pitch jump
    let vScore = 0;
    if (rmsDip[t] >= 3.2) {
      vScore = Math.max(vScore, Math.min(1.0, (rmsDip[t] - 1.5) / 5.5));
    }
    if (nasalDip[t] >= 3.2 && act >= 0.45) {
      vScore = Math.max(vScore, Math.min(1.0, (nasalDip[t] - 1.5) / 5.0));
    }
    if (pitchVel[t] >= 1.35 && formantFlux[t] >= 1.4) {
      vScore = Math.max(vScore, 0.75);
    }
    if (act <= 0.18 && t >= 2 && t + 2 < T && activity[t - 2] >= 0.45 && activity[t + 2] >= 0.45) {
      vScore = Math.max(vScore, 1.0);
    }
    valleySignal[t] = vScore;
  }

  // Peak-pick local maxima on valleySignal so wide dips aren't double-counted per frame
  for (let t = 1; t < T - 1; t++) {
    const v = valleySignal[t];
    const isPeak =
      v >= 0.45 && v >= valleySignal[t - 1] && v > valleySignal[t + 1];
    cumStrongValleys[t + 1] = cumStrongValleys[t] + (isPeak ? v : 0);
  }
  cumStrongValleys[T] = cumStrongValleys[T - 1];

  const totalActiveFrames = cumActivity[T];
  if (totalActiveFrames < W * 2.0) return;

  const wordWeights = rawTokens.map((tk, idx) =>
    deps.computeWordIntrinsicDurationWeight(tk, idx === W - 1)
  );
  const wordPhonStates = rawTokens.map((tk) => deps.decomposeVietnameseWordPhoneticStates(tk));
  const wordOrtho = rawTokens.map((tk) => deps.extractVietnameseWordVowel(tk));
  const wordTones = rawTokens.map((tk) => deps.extractVietnameseToneContour(tk));

  const boundaryBonusAt = (wIdx: number, k: number): number => {
    if (k <= 0 || k >= T) return 0;
    const state = wordPhonStates[wIdx];
    const silToActiveJump = Math.max(0, activity[k] - activity[k - 1]);
    let bonus =
      formantFlux[k] * 1.35 +
      Math.min(10, rmsDip[k] * 0.9) +
      pitchVel[k] +
      barOnsetBonus[k] +
      (silToActiveJump >= 0.2 ? silToActiveJump * 5.2 : 0);

    if (state.onsetState === 'STOP_FRIC') {
      bonus += Math.min(9.0, hfRise[k] * 0.85) + Math.min(5.0, rmsDip[k] * 0.6);
    } else if (state.onsetState === 'NASAL_LIQUID') {
      bonus += Math.min(8.0, nasalDip[k] * 0.95);
    } else {
      bonus += formantFlux[k] * 0.7;
    }

    const wordTs = wordTimestamps?.[wIdx]?.timeMs;
    if (wordTs && Number.isFinite(wordTs)) {
      const kMs = baseStartMs + k * stepMs;
      const dist = Math.abs(kMs - wordTs);
      if (dist <= 260) {
        bonus += ((260 - dist) / 260) * 7.2;
      }
    }
    return bonus;
  };

  // Discover independent Clause Anchor Islands so error before a pause never shifts after the pause
  const segments = discoverClauseAnchorSegments({
    rawTokens,
    activity,
    formantFlux,
    rmsDip,
    barOnsetBonus,
    stepMs,
    baseStartMs,
    T,
    wordTimestamps,
    wordWeights,
  });

  const finalBoundsStart = new Int32Array(W);
  const finalBoundsEnd = new Int32Array(W);

  for (const seg of segments) {
    const wStart = seg.wStart;
    const wEnd = seg.wEnd;
    const W_sub = wEnd - wStart + 1;

    let segS = seg.fStart;
    let segE = seg.fEnd;
    const minNeededFrames = W_sub * 2;
    while (segS + minNeededFrames < segE && activity[segS] <= 0.13) segS++;
    while (segE - minNeededFrames > segS && activity[segE - 1] <= 0.13) segE--;

    const T_sub = segE - segS;
    if (T_sub < W_sub * 2) {
      const stepF = (seg.fEnd - seg.fStart) / W_sub;
      for (let i = 0; i < W_sub; i++) {
        finalBoundsStart[wStart + i] = Math.round(seg.fStart + i * stepF);
        finalBoundsEnd[wStart + i] = Math.max(
          finalBoundsStart[wStart + i] + 1,
          Math.round(seg.fStart + (i + 1) * stepF)
        );
      }
      continue;
    }

    const segTotalWeight =
      wordWeights.slice(wStart, wEnd + 1).reduce((s, w) => s + w, 0) || 1;
    const segActiveTotal = Math.max(W_sub * 2.0, cumActivity[segE] - cumActivity[segS]);

    const minFramesPerWord = Math.max(
      2,
      Math.min(3, Math.floor(T_sub / (W_sub * 1.5)))
    );

    const dpEnd: Float64Array[] = Array.from({ length: W_sub }, () =>
      new Float64Array(segE + 1).fill(Infinity)
    );
    const prevWordEnd: Int32Array[] = Array.from({ length: W_sub }, () =>
      new Int32Array(segE + 1).fill(-1)
    );
    const chosenStart: Int32Array[] = Array.from({ length: W_sub }, () =>
      new Int32Array(segE + 1).fill(segS)
    );

    const evaluateSegmentSpanCost = (
      wIdx: number,
      s: number,
      e: number,
      segPeakDb: number
    ): number => {
      const segActiveFrames = cumActivity[e] - cumActivity[s];
      const segActiveMs = segActiveFrames * stepMs;
      const baseExpectedFrames = (wordWeights[wIdx] / segTotalWeight) * segActiveTotal;
      const hasMelismaHold =
        (words[wIdx].melismaNotesCount || 1) >= 2 && (words[wIdx].durationMs || 0) > 250;
      const expectedFrames = hasMelismaHold
        ? baseExpectedFrames * 0.4 + ((words[wIdx].durationMs || 300) / stepMs) * 0.6
        : baseExpectedFrames;
      const expectedMs = expectedFrames * stepMs;

      let cost = 0;

      // 1. Acoustic Core Integrity (never land purely in dead air or swallow silence edges)
      if (segActiveMs < 35 || segPeakDb < maxDb - 19) {
        cost += 16.0;
      }
      if (activity[s] <= 0.16) cost += 2.6;
      if (activity[e - 1] <= 0.16) cost += 2.6;

      // 2. Multi-Peak Syllable Integrity (CORE ANTI-DOMINO PENALTY!)
      // Stops a single non-melisma word from swallowing >= 2 distinct syllable peaks
      const valleysInside =
        e - s >= 4 ? Math.max(0, cumStrongValleys[e - 1] - cumStrongValleys[s + 1]) : 0;
      if (valleysInside > 0.35) {
        cost += valleysInside * (hasMelismaHold ? 2.8 : 11.2);
      }

      // 3. Phonological duration constraints (unchecked holds can expand freely without 360ms clipping!)
      const isChecked = wordOrtho[wIdx]?.isCheckedStop;
      const isEndPhrase = wIdx === W - 1 || /[,.;!?]$/.test(rawTokens[wIdx]);
      if (isChecked && segActiveMs > Math.max(290, expectedMs * 1.9)) {
        cost += ((segActiveMs - Math.max(290, expectedMs * 1.9)) / 100) * 3.8;
      } else if (
        !isEndPhrase &&
        !hasMelismaHold &&
        segActiveMs > expectedMs * 2.5 &&
        expectedMs > 80
      ) {
        cost += ((segActiveMs - expectedMs * 2.5) / 140) * 1.4;
      }

      const relDiff = Math.abs(segActiveFrames - expectedFrames) / Math.max(2.5, expectedFrames);
      cost += Math.min(3.8, relDiff * (isEndPhrase || hasMelismaHold ? 0.55 : 0.95));

      // 4. Onset & Release Boundaries
      if (s > segS) {
        cost -= boundaryBonusAt(wIdx, s);
      } else if (wIdx === 0 && activity[s] >= 0.45) {
        cost -= 1.2;
      }
      if (e < segE && (rmsDip[e] >= 2.2 || activity[e] <= 0.24 || formantFlux[e] >= 1.5)) {
        cost -= 1.6;
      }

      // 5. Optional Enhanced LRC WordTimestamp Affinity
      const tsMs = wordTimestamps?.[wIdx]?.timeMs;
      if (tsMs && Number.isFinite(tsMs)) {
        const sMs = baseStartMs + s * stepMs;
        const tsDist = Math.abs(sMs - tsMs);
        if (tsDist <= 280) {
          cost -= (1 - tsDist / 280) * 4.5;
        } else {
          cost += Math.min(5.0, (tsDist - 280) / 140);
        }
      }

      // 6. Vietnamese Tone Contour vs Intra-Word Pitch Slope
      const tone = wordTones[wIdx];
      if (tone !== 'level' && e - s >= 3) {
        const fStartMidi = frameMidis[s];
        const fEndMidi = frameMidis[e - 1];
        if (fStartMidi > 0 && fEndMidi > 0) {
          const dMidi = fEndMidi - fStartMidi;
          if (tone === 'rising' && dMidi >= 0.4) cost -= 0.9;
          else if (tone === 'falling' && dMidi <= -0.4) cost -= 0.9;
        }
      }

      return cost;
    };

    // Viterbi forward pass with O(1) SIL-Gap sliding prefix minimum
    for (let i = 0; i < W_sub; i++) {
      const wIdx = wStart + i;
      const isChecked = Boolean(wordOrtho[wIdx]?.isCheckedStop);
      const minLen = isChecked ? Math.min(2, minFramesPerWord) : minFramesPerWord;
      // Un-truncated max word duration so sustained vowels (1.2s-3s) fit cleanly without shoving neighbors!
      const maxLen = isChecked
        ? Math.max(18, Math.ceil(T_sub * 0.36))
        : Math.max(48, Math.ceil(T_sub * 0.78));

      const earliestEnd = segS + (i + 1) * minLen;
      const latestEnd = segE - (W_sub - 1 - i) * minLen;

      // Precompute O(1) best SIL entry cost `bestGapBase[s] = min_{p <= s}(dpEnd[i-1][p] - cumSilCost[p])`
      const bestGapBase = new Float64Array(segE + 1).fill(Infinity);
      const bestGapPrevEnd = new Int32Array(segE + 1).fill(-1);

      if (i === 0) {
        for (let s = segS; s <= segE; s++) {
          bestGapBase[s] = -cumSilCost[segS];
          bestGapPrevEnd[s] = segS;
        }
      } else {
        let runMin = Infinity;
        let runEnd = -1;
        for (let s = segS; s <= segE; s++) {
          if (dpEnd[i - 1][s] < Infinity) {
            const val = dpEnd[i - 1][s] - cumSilCost[s];
            if (val < runMin) {
              runMin = val;
              runEnd = s;
            }
          }
          bestGapBase[s] = runMin;
          bestGapPrevEnd[s] = runEnd;
        }
      }

      const earliestStart = segS + i * minLen;
      for (let e = earliestEnd; e <= latestEnd; e++) {
        const minS = Math.max(earliestStart, e - maxLen);
        const maxS = e - minLen;
        let segPeakDb = -120;
        for (let t = maxS + 1; t < e; t++) {
          if (smoothEnergyDb[t] > segPeakDb) segPeakDb = smoothEnergyDb[t];
        }

        let bestE = Infinity;
        let bestS = minS;
        let bestPrevE = -1;

        for (let s = maxS; s >= minS; s--) {
          if (smoothEnergyDb[s] > segPeakDb) segPeakDb = smoothEnergyDb[s];
          const base = bestGapBase[s];
          if (base === Infinity) continue;
          const gapCost = base + cumSilCost[s];
          const cand = gapCost + evaluateSegmentSpanCost(wIdx, s, e, segPeakDb);
          if (cand < bestE) {
            bestE = cand;
            bestS = s;
            bestPrevE = bestGapPrevEnd[s];
          }
        }

        dpEnd[i][e] = bestE;
        chosenStart[i][e] = bestS;
        prevWordEnd[i][e] = bestPrevE;
      }
    }

    // Include trailing SIL gap cost after final word in segment `[e .. segE]`
    let bestFinalE = segE;
    let bestFinalCost = Infinity;
    const minLastEnd = segS + W_sub * minFramesPerWord;
    for (let e = Math.min(segE, minLastEnd); e <= segE; e++) {
      if (dpEnd[W_sub - 1][e] === Infinity) continue;
      const cand = dpEnd[W_sub - 1][e] + (cumSilCost[segE] - cumSilCost[e]);
      if (cand < bestFinalCost) {
        bestFinalCost = cand;
        bestFinalE = e;
      }
    }

    if (bestFinalCost === Infinity) {
      const stepF = (segE - segS) / W_sub;
      for (let i = 0; i < W_sub; i++) {
        finalBoundsStart[wStart + i] = Math.round(segS + i * stepF);
        finalBoundsEnd[wStart + i] = Math.max(
          finalBoundsStart[wStart + i] + 1,
          Math.round(segS + (i + 1) * stepF)
        );
      }
      continue;
    }

    // Backtrack segment words
    let curE = bestFinalE;
    for (let i = W_sub - 1; i >= 0; i--) {
      const s = chosenStart[i][curE];
      finalBoundsStart[wStart + i] = s;
      finalBoundsEnd[wStart + i] = curE;
      curE = prevWordEnd[i][curE];
      if (i > 0 && curE < 0) break;
    }

    // Outlier Word Rescue Post-Pass inside segment:
    // If word `i` landed on weak energy while an uncovered vocal peak sits in an adjacent SIL gap,
    // snap ONLY that weak word locally without touching verified neighbors!
    for (let i = 0; i < W_sub; i++) {
      const wIdx = wStart + i;
      let s = finalBoundsStart[wIdx];
      let e = finalBoundsEnd[wIdx];
      let wPeak = -120;
      for (let t = s; t < e; t++) {
        if (smoothEnergyDb[t] > wPeak) wPeak = smoothEnergyDb[t];
      }
      if (wPeak >= maxDb - 13) continue;

      const leftLimit = i > 0 ? finalBoundsEnd[wIdx - 1] : segS;
      const rightLimit = i + 1 < W_sub ? finalBoundsStart[wIdx + 1] : segE;
      if (rightLimit - leftLimit <= e - s + 2) continue;

      // Search left or right gap for strongest vocal energy peak inside [leftLimit .. rightLimit]
      let bestPeakK = -1;
      let bestPeakDb = -120;
      for (let t = leftLimit; t < rightLimit; t++) {
        if (smoothEnergyDb[t] > bestPeakDb) {
          bestPeakDb = smoothEnergyDb[t];
          bestPeakK = t;
        }
      }
      if (bestPeakK >= 0 && bestPeakDb > wPeak + 4.5) {
        const halfSpan = Math.max(2, Math.floor((e - s) / 2));
        s = Math.max(leftLimit, bestPeakK - halfSpan);
        e = Math.min(rightLimit, Math.max(s + 2, bestPeakK + halfSpan));
        finalBoundsStart[wIdx] = s;
        finalBoundsEnd[wIdx] = e;
      }
    }
  }

  // Write synchronized word timestamps and recompute local MIDI pitch & sustain stats
  for (let w = 0; w < W; w++) {
    let fStart = finalBoundsStart[w];
    let fEnd = Math.max(fStart + 2, finalBoundsEnd[w]);

    // Trim faint edge silence cleanly inside each individual word window
    while (fStart + 2 < fEnd && activity[fStart] <= 0.14) fStart++;
    while (fEnd - 2 > fStart && activity[fEnd - 1] <= 0.14) fEnd--;

    const wStartMs = Math.round(baseStartMs + fStart * stepMs);
    const wEndMs = Math.max(wStartMs + 50, Math.round(baseStartMs + fEnd * stepMs));
    words[w].startMs = wStartMs;
    words[w].endMs = wEndMs;
    words[w].durationMs = Math.max(50, wEndMs - wStartMs);

    const localStats = deps.computeWordAcousticStats(
      wStartMs,
      wEndMs,
      pitchTrack,
      words[w].midi,
      Boolean(wordOrtho[w]?.isCheckedStop),
      words[w].melismaNotesCount || 1
    );
    words[w].midi = localStats.midi;
    words[w].noteName = localStats.noteName;
    words[w].solfege = localStats.solfege;
    words[w].sustainCoreMs = localStats.sustainCoreMs;
    words[w].sustainKind = localStats.sustainKind;
    if (!words[w].melismaNotesCount || words[w].melismaNotesCount === 1) {
      words[w].noteSequence = [localStats.noteName];
      words[w].solfegeSequence = [localStats.solfege];
    }
  }

  for (let w = 0; w < W; w++) {
    words[w].stepSemitones = w > 0 ? words[w].midi - words[w - 1].midi : 0;
  }

  if (words.length > 0) {
    phrase.startMs = words[0].startMs;
    phrase.endMs = words[W - 1].endMs;
    phrase.durationMs = Math.max(200, phrase.endMs - phrase.startMs);
  }

  if (splitNoteBarsToMatch) {
    let didSplit = true;
    let guard = 0;
    while (didSplit && guard < 16) {
      didSplit = false;
      guard++;
      const currentPhraseBars = deps.getPhraseNoteBarsStrict(phrase, allNoteBars);
      for (const bar of currentPhraseBars) {
        if (bar.durationMs < 160) continue;
        const insideStarts = words
          .filter(
            (w) =>
              w.wordIndex > 0 &&
              w.startMs >= bar.startTimeMs + 60 &&
              w.startMs <= bar.endTimeMs - 60
          )
          .sort((a, b) => a.startMs - b.startMs);
        if (insideStarts.length > 0) {
          const allIdx = allNoteBars.findIndex((b) => b.id === bar.id);
          if (allIdx >= 0) {
            const tempList = [bar];
            deps.splitSingleBarAtMs(tempList, allNoteBars, 0, insideStarts[0].startMs, pitchTrack);
            didSplit = true;
            break;
          }
        }
      }
    }

    const syncedBars = deps.getPhraseNoteBarsStrict(phrase, allNoteBars);
    for (const bar of syncedBars) {
      const bMid = (bar.startTimeMs + bar.endTimeMs) / 2;
      const matchingWord =
        words.find((w) => bMid >= w.startMs - 20 && bMid <= w.endMs + 20) ||
        words.reduce((best, w) => {
          const curDist = Math.abs((w.startMs + w.endMs) / 2 - bMid);
          const bestDist = Math.abs((best.startMs + best.endMs) / 2 - bMid);
          return curDist < bestDist ? w : best;
        }, words[0]);
      if (matchingWord) {
        bar.lyricSyllable = matchingWord.text;
        bar.vowelHint = matchingWord.vowelHint;
      }
    }
  }
}
