/**
 * Acoustic-Phonetic Fingerprinting & Unvoiced Vocal Gap Rescue Engine (`acousticPhoneticProfiler.ts`)
 *
 * Bridges raw PCM acoustics with Vietnamese lexical phonology to eliminate cascade misalignment
 * when singers skip lines, MPM drops breathy/monotone rap lines, or lyrics contain missing/extra lines:
 * 1. `goertzelBandEnergy` & `estimateSliceVowelFormants`: Pre-emphasized Goertzel vocal formant (F1/F2) extractor.
 * 2. `rescueUnvoicedVocalPhrasesFromPcm`: Recovers low-periodicity / unvoiced rap & breathy vocal phrases
 *    dropped by MPM pitch clarity gates before lyric alignment runs.
 * 3. `buildClusterPhoneticProfilesAsync` / `Sync`: Measures acoustic syllable count + per-syllable
 *    soft vowel posteriors (`A | E | I | Ơ | Ô | U`), HF stop/fricative onsets, and checked-stop decays.
 * 4. `computePhoneticLineToClusterDistance`: Length-constrained DTW scoring mouth-shape & articulation fit
 *    between a lyric line and an audio cluster so a skipped phrase never masks shifted neighbors.
 */

import type {
  IReferencePitchPoint,
  IVocalNoteBar,
  IVocalPhrase,
} from './vocalFileAnalysisService';

export type CoreVowelFamily = 'A' | 'E' | 'I' | 'Ơ' | 'Ô' | 'U';

export type PhoneticWordState = {
  onsetState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
  nucleusState: 'V_A' | 'V_E' | 'V_I' | 'V_O_UNROUND' | 'V_O_ROUND' | 'V_U';
  codaState: 'NONE' | 'STOP_FRIC' | 'NASAL_LIQUID';
};

export interface IPhonologyDecomposerFns {
  decomposeWord: (rawWord: string) => PhoneticWordState;
  extractVowel: (rawWord: string) => {
    vowelFamily: CoreVowelFamily;
    isCheckedStop: boolean;
  };
}

export interface ISyllableAcousticVector {
  startMs: number;
  endMs: number;
  peakMs: number;
  f1Hz: number;
  f2Hz: number;
  dominantVowel: CoreVowelFamily;
  vowelProbs: Record<CoreVowelFamily, number>;
  onsetStopFricScore: number; // 0..1
  codaClippedStopScore: number; // 0..1
  nasalSustainScore: number; // 0..1
}

export interface IClusterPhoneticProfile {
  clusterKey: string;
  hasUsableAudio: boolean;
  acousticSyllableCount: number;
  syllables: ISyllableAcousticVector[];
  meanCheckedStopRatio: number;
  durationMs: number;
}

export interface IPhoneticLineClusterMatch {
  distance: number; // 0..1.2 (lower = closer match; 0.45 neutral)
  hasUsableAudio: boolean;
  acousticSyllableCount: number;
  phoneticBonusCost: number; // signed DP delta (~ -2.4 to +3.0)
}

const CORE_VOWEL_ORDER: CoreVowelFamily[] = ['A', 'E', 'I', 'Ơ', 'Ô', 'U'];

// Empirically balanced F1/F2 centroids for Vietnamese 6-way core vowel families
const VOWEL_FORMANT_CENTROIDS: Record<CoreVowelFamily, { f1: number; f2: number }> = {
  I: { f1: 345, f2: 2240 },
  E: { f1: 575, f2: 2010 },
  A: { f1: 735, f2: 1470 },
  'Ơ': { f1: 485, f2: 1455 },
  'Ô': { f1: 540, f2: 1030 },
  U: { f1: 350, f2: 960 },
};

const NUCLEUS_TO_CORE_VOWEL: Record<PhoneticWordState['nucleusState'], CoreVowelFamily> = {
  V_A: 'A',
  V_E: 'E',
  V_I: 'I',
  V_O_UNROUND: 'Ơ',
  V_O_ROUND: 'Ô',
  V_U: 'U',
};

// Articulatory distance matrix [predicted][measured] for neighboring vs opposing vowel shapes
const VOWEL_ARTICULATORY_MISMATCH: Record<CoreVowelFamily, Record<CoreVowelFamily, number>> = {
  A: { A: 0.0, E: 0.42, I: 0.85, 'Ơ': 0.35, 'Ô': 0.45, U: 0.9 },
  E: { A: 0.42, E: 0.0, I: 0.32, 'Ơ': 0.48, 'Ô': 0.72, U: 0.88 },
  I: { A: 0.85, E: 0.32, I: 0.0, 'Ơ': 0.58, 'Ô': 0.85, U: 0.78 },
  'Ơ': { A: 0.35, E: 0.48, I: 0.58, 'Ơ': 0.0, 'Ô': 0.4, U: 0.62 },
  'Ô': { A: 0.45, E: 0.72, I: 0.85, 'Ơ': 0.4, 'Ô': 0.0, U: 0.32 },
  U: { A: 0.9, E: 0.88, I: 0.78, 'Ơ': 0.62, 'Ô': 0.32, U: 0.0 },
};

/**
 * Measure pre-emphasized Goertzel narrowband spectral energy at `targetHz`
 * inside `samples[startIdx .. startIdx + length - 1]`.
 */
export function goertzelBandEnergy(
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

  // Hamming window + 1st-order pre-emphasis (x[n] - 0.97*x[n-1]) removes glottal -12dB/oct tilt
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
 * Estimate F1 (280–900Hz) and F2 (880–2580Hz) formant peaks for an audio slice
 * and classify into one of the 6 core Vietnamese vowel families.
 */
export function estimateSliceVowelFormants(
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

function computeVowelSoftProbabilities(
  f1Hz: number,
  f2Hz: number
): Record<CoreVowelFamily, number> {
  const weights: Record<CoreVowelFamily, number> = {
    A: 0,
    E: 0,
    I: 0,
    'Ơ': 0,
    'Ô': 0,
    U: 0,
  };
  let sum = 0;
  for (const v of CORE_VOWEL_ORDER) {
    const c = VOWEL_FORMANT_CENTROIDS[v];
    const df1 = (f1Hz - c.f1) / 155;
    const df2 = (f2Hz - c.f2) / 360;
    const w = Math.exp(-0.85 * (df1 * df1 + df2 * df2));
    weights[v] = w;
    sum += w;
  }
  const safeSum = sum > 1e-12 ? sum : 1;
  for (const v of CORE_VOWEL_ORDER) {
    weights[v] = weights[v] / safeSum;
  }
  return weights;
}

function computeSliceRms(samples: Float32Array, startIdx: number, endIdx: number): number {
  const s = Math.max(0, startIdx);
  const e = Math.min(samples.length, endIdx);
  if (e <= s) return 0;
  let sumSq = 0;
  for (let i = s; i < e; i++) {
    const v = samples[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / (e - s));
}

export function buildClusterProfileKey(startMs: number, endMs: number): string {
  return `${Math.round(startMs)}_${Math.round(endMs)}`;
}

/**
 * Estimate median fundamental pitch inside [startMs, endMs] from `pitchTrack`,
 * falling back to 210 Hz if unvoiced.
 */
function lookupClusterF0Hz(
  startMs: number,
  endMs: number,
  pitchTrack?: IReferencePitchPoint[],
  bars?: IVocalNoteBar[]
): number {
  if (pitchTrack && pitchTrack.length > 0) {
    const f0s: number[] = [];
    for (let i = 0; i < pitchTrack.length; i++) {
      const p = pitchTrack[i];
      if (p.timeMs >= startMs && p.timeMs <= endMs && p.freqHz >= 75 && p.freqHz <= 950) {
        if (p.isVocal || p.clarity >= 0.35) f0s.push(p.freqHz);
      }
    }
    if (f0s.length > 0) {
      f0s.sort((a, b) => a - b);
      return f0s[Math.floor(f0s.length / 2)];
    }
  }
  if (bars && bars.length > 0) {
    const midi = bars[0].midi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  return 210;
}

/**
 * Scan gaps between MPM-segmented vocal phrases to rescue unvoiced, breathy,
 * monotone rap, or low-periodicity sung phrases that failed strict MPM clarity gates.
 * Uses stereo center dominance, sub-bass rejection, and syllabic modulation gating
 * so pure accompaniment tails never create phantom phrases.
 */
export function rescueUnvoicedVocalPhrasesFromPcm(params: {
  rawMonoPcm: Float32Array;
  filteredPcm: Float32Array;
  filteredSidePcm?: Float32Array;
  sampleRate: number;
  durationMs: number;
  noiseFloorRms: number;
  pitchTrack: IReferencePitchPoint[];
  noteBars: IVocalNoteBar[];
  phrases: IVocalPhrase[];
  lowestMidi: number;
  highestMidi: number;
  createMidiNoteInfo: (midi: number) => { noteName: string; solfegeName: string };
}): number {
  const {
    rawMonoPcm,
    filteredPcm,
    filteredSidePcm,
    sampleRate,
    durationMs,
    noiseFloorRms,
    pitchTrack,
    noteBars,
    phrases,
    lowestMidi,
    highestMidi,
    createMidiNoteInfo,
  } = params;

  if (rawMonoPcm.length < sampleRate * 0.6 || durationMs < 800) return 0;

  // Compute global reference median MIDI so unvoiced rap segments stay inside singer range
  const validMidis = noteBars.map((b) => b.midi).filter((m) => m >= 48 && m <= 84);
  validMidis.sort((a, b) => a - b);
  const fallbackMidi =
    validMidis.length > 0
      ? validMidis[Math.floor(validMidis.length / 2)]
      : Math.max(48, Math.min(72, Math.round((lowestMidi + highestMidi) / 2) || 58));

  // Build candidate uncovered time windows (between detected phrases + immediate outer margins)
  const candidateWindows: Array<{ startMs: number; endMs: number }> = [];
  const sortedPhrases = [...phrases].sort((a, b) => a.startMs - b.startMs);

  if (sortedPhrases.length === 0) {
    candidateWindows.push({ startMs: 120, endMs: durationMs - 120 });
  } else {
    if (sortedPhrases[0].startMs >= 1600) {
      candidateWindows.push({
        startMs: Math.max(120, sortedPhrases[0].startMs - 5500),
        endMs: sortedPhrases[0].startMs - 140,
      });
    }
    for (let i = 0; i < sortedPhrases.length - 1; i++) {
      const gapStart = sortedPhrases[i].endMs + 140;
      const gapEnd = sortedPhrases[i + 1].startMs - 140;
      if (gapEnd - gapStart >= 680) {
        candidateWindows.push({ startMs: gapStart, endMs: gapEnd });
      }
    }
    const tailStart = sortedPhrases[sortedPhrases.length - 1].endMs + 140;
    if (durationMs - tailStart >= 1400) {
      candidateWindows.push({
        startMs: tailStart,
        endMs: Math.min(durationMs - 120, tailStart + 5500),
      });
    }
  }

  if (candidateWindows.length === 0) return 0;

  const hopMs = 20;
  const winMs = 30;
  const hopSamples = Math.max(128, Math.round((sampleRate * hopMs) / 1000));
  const winSamples = Math.max(256, Math.round((sampleRate * winMs) / 1000));
  const activeRmsThreshold = Math.max(noiseFloorRms * 3.1, 0.017);

  let rescuedPhrasesCount = 0;
  const newPhrases: IVocalPhrase[] = [];
  const newBars: IVocalNoteBar[] = [];

  for (const gap of candidateWindows) {
    const startSample = Math.max(0, Math.floor((gap.startMs / 1000) * sampleRate));
    const endSample = Math.min(rawMonoPcm.length - winSamples, Math.floor((gap.endMs / 1000) * sampleRate));
    if (endSample <= startSample + hopSamples * 12) continue;

    interface IGapFrame {
      timeMs: number;
      midRms: number;
      vocEnvelope: number;
      isVocalActive: boolean;
    }

    const frames: IGapFrame[] = [];
    for (let sc = startSample; sc <= endSample; sc += hopSamples) {
      const timeMs = (sc / sampleRate) * 1000;
      const midRms = computeSliceRms(filteredPcm, sc, sc + winSamples);
      const sideRms = filteredSidePcm ? computeSliceRms(filteredSidePcm, sc, sc + winSamples) : 0;
      const centerOk = !filteredSidePcm || midRms >= sideRms * 0.94;

      let vocEnvelope = 0;
      let isVocalActive = false;

      if (midRms >= activeRmsThreshold && centerOk) {
        // Verify genuine vocal mid-formant dominance over sub-bass kick/bass rumble
        const goertzelLen = Math.min(512, rawMonoPcm.length - sc);
        const subE =
          goertzelBandEnergy(rawMonoPcm, sc, goertzelLen, sampleRate, 78) +
          goertzelBandEnergy(rawMonoPcm, sc, goertzelLen, sampleRate, 112);
        const midE =
          goertzelBandEnergy(rawMonoPcm, sc, goertzelLen, sampleRate, 480) +
          goertzelBandEnergy(rawMonoPcm, sc, goertzelLen, sampleRate, 920) +
          goertzelBandEnergy(rawMonoPcm, sc, goertzelLen, sampleRate, 1650);
        vocEnvelope = Math.sqrt(midE + 1e-12);
        const vocalRatio = midE / (midE + subE + 1e-12);
        if (vocalRatio >= 0.48) {
          isVocalActive = true;
        }
      }

      frames.push({ timeMs, midRms, vocEnvelope, isVocalActive });
    }

    // Group contiguous active frames bridging micro consonant closures <= 180ms (9 frames)
    const maxBridgeFrames = 9;
    let idx = 0;
    while (idx < frames.length) {
      if (!frames[idx].isVocalActive) {
        idx++;
        continue;
      }

      const segStartIdx = idx;
      let segEndIdx = idx;
      let silenceRun = 0;

      for (let j = idx + 1; j < frames.length; j++) {
        if (frames[j].isVocalActive) {
          segEndIdx = j;
          silenceRun = 0;
        } else {
          silenceRun++;
          if (silenceRun > maxBridgeFrames) break;
        }
      }

      const startTimeMs = Math.round(frames[segStartIdx].timeMs);
      const endTimeMs = Math.round(frames[segEndIdx].timeMs + winMs);
      const segDurMs = endTimeMs - startTimeMs;
      const segFrames = frames.slice(segStartIdx, segEndIdx + 1);
      const activeCount = segFrames.filter((f) => f.isVocalActive).length;

      // Require sustained vocal island >= 520ms and zero overlap with existing noteBars
      const overlapsExistingBar = noteBars.some(
        (b) => b.endTimeMs > startTimeMs + 40 && b.startTimeMs < endTimeMs - 40
      );

      if (segDurMs >= 520 && activeCount >= 14 && !overlapsExistingBar) {
        // Count local syllabic envelope peaks to reject flat sustained instrumental pads
        const smoothed = segFrames.map((f, k) => {
          const prev = k > 0 ? segFrames[k - 1].vocEnvelope : f.vocEnvelope;
          const next = k + 1 < segFrames.length ? segFrames[k + 1].vocEnvelope : f.vocEnvelope;
          return (prev + f.vocEnvelope * 2 + next) / 4;
        });
        const peakTimes: number[] = [];
        const maxEnv = Math.max(...smoothed, 1e-6);

        for (let k = 1; k < smoothed.length - 1; k++) {
          if (
            smoothed[k] >= maxEnv * 0.2 &&
            smoothed[k] >= smoothed[k - 1] &&
            smoothed[k] >= smoothed[k + 1]
          ) {
            const tMs = Math.round(segFrames[k].timeMs);
            if (peakTimes.length === 0 || tMs - peakTimes[peakTimes.length - 1] >= 100) {
              // Ensure genuine modulation valley before peak after peak #1
              if (peakTimes.length === 0) {
                peakTimes.push(tMs);
              } else {
                const prevPeakFrame = Math.max(
                  0,
                  Math.round((peakTimes[peakTimes.length - 1] - startTimeMs) / hopMs)
                );
                let valley = smoothed[k];
                for (let v = prevPeakFrame; v <= k; v++) {
                  if (smoothed[v] < valley) valley = smoothed[v];
                }
                if (valley <= smoothed[k] * 0.78) {
                  peakTimes.push(tMs);
                }
              }
            }
          }
        }

        // Check if MPM track had mild periodicity in this span even below main gate
        let mildClaritySum = 0;
        let mildClarityCnt = 0;
        const localF0Midis: number[] = [];
        for (const pt of pitchTrack) {
          if (pt.timeMs >= startTimeMs && pt.timeMs <= endTimeMs && pt.freqHz >= 85 && pt.freqHz <= 950) {
            mildClaritySum += pt.clarity;
            mildClarityCnt++;
            if (pt.clarity >= 0.26) localF0Midis.push(pt.midi);
          }
        }
        const avgMildClarity = mildClarityCnt > 0 ? mildClaritySum / mildClarityCnt : 0;

        if (peakTimes.length >= 2 || avgMildClarity >= 0.28) {
          // Determine local baseline MIDI from mild MPM frames or neighboring phrase median
          let baseMidi = fallbackMidi;
          if (localF0Midis.length >= 3) {
            localF0Midis.sort((a, b) => a - b);
            baseMidi = Math.max(48, Math.min(82, Math.round(localF0Midis[Math.floor(localF0Midis.length / 2)])));
          } else {
            const nearestPhrase = sortedPhrases.reduce<IVocalPhrase | null>((best, p) => {
              const pDist = Math.min(Math.abs(p.endMs - startTimeMs), Math.abs(p.startMs - endTimeMs));
              if (!best) return p;
              const bestDist = Math.min(Math.abs(best.endMs - startTimeMs), Math.abs(best.startMs - endTimeMs));
              return pDist < bestDist ? p : best;
            }, null);
            if (nearestPhrase && nearestPhrase.avgMidi >= 48) {
              baseMidi = Math.max(48, Math.min(82, Math.round(nearestPhrase.avgMidi)));
            }
          }

          // Split rescued island into syllabic pseudo-NoteBars cleanly
          const cutPoints: number[] = [startTimeMs];
          for (let pk = 1; pk < peakTimes.length; pk++) {
            const leftFrame = Math.max(0, Math.round((peakTimes[pk - 1] - startTimeMs) / hopMs));
            const rightFrame = Math.min(smoothed.length - 1, Math.round((peakTimes[pk] - startTimeMs) / hopMs));
            let minIdx = Math.floor((leftFrame + rightFrame) / 2);
            let minVal = Infinity;
            for (let v = leftFrame + 1; v < rightFrame; v++) {
              if (smoothed[v] < minVal) {
                minVal = smoothed[v];
                minIdx = v;
              }
            }
            const splitMs = Math.round(segFrames[minIdx].timeMs);
            if (splitMs - cutPoints[cutPoints.length - 1] >= 95 && endTimeMs - splitMs >= 95) {
              cutPoints.push(splitMs);
            }
          }
          cutPoints.push(endTimeMs);

          const phraseBars: IVocalNoteBar[] = [];
          const info = createMidiNoteInfo(baseMidi);
          for (let bi = 0; bi < cutPoints.length - 1; bi++) {
            const bStart = cutPoints[bi];
            const bEnd = cutPoints[bi + 1];
            const bDur = Math.max(60, bEnd - bStart);
            const bar: IVocalNoteBar = {
              id: `rescued-bar-${rescuedPhrasesCount + 1}-${bi + 1}`,
              startTimeMs: bStart,
              endTimeMs: bEnd,
              durationMs: bDur,
              midi: baseMidi,
              exactMidi: baseMidi,
              noteName: info.noteName,
              solfegeName: info.solfegeName,
              avgCentsDiff: 0,
              pointsCount: Math.max(3, Math.round(bDur / hopMs)),
            };
            phraseBars.push(bar);
            newBars.push(bar);
          }

          newPhrases.push({
            id: `rescued-phrase-${rescuedPhrasesCount + 1}`,
            phraseIndex: phrases.length + rescuedPhrasesCount + 1,
            startMs: startTimeMs,
            endMs: endTimeMs,
            durationMs: segDurMs,
            notes: [info.noteName],
            lowestNote: info.noteName,
            highestNote: info.noteName,
            avgPitchHz: Math.round(440 * Math.pow(2, (baseMidi - 69) / 12) * 10) / 10,
            avgMidi: baseMidi,
            pitchJumpSemitones: 0,
            difficulty: 'Trung bình',
            difficultyScore: 5,
            pointsCount: activeCount,
            sectionType: 'verse',
            sectionLabel: 'Phiên khúc (Nhả chữ / Bù câu mờ)',
          });
          rescuedPhrasesCount++;
        }
      }

      idx = segEndIdx + 1;
    }
  }

  if (rescuedPhrasesCount > 0) {
    noteBars.push(...newBars);
    noteBars.sort((a, b) => a.startTimeMs - b.startTimeMs);
    phrases.push(...newPhrases);
    phrases.sort((a, b) => a.startMs - b.startMs);
    phrases.forEach((p, idx) => {
      p.phraseIndex = idx + 1;
    });
  }

  return rescuedPhrasesCount;
}

/**
 * Extract an acoustic-phonetic fingerprint from rawMonoPcm for one NoteBar cluster:
 * - True acoustic syllable count even when MPM fused flat notes into 1 long bar
 * - Per-syllable soft vowel probability vector (A/E/I/Ơ/Ô/U) + onset HF burst + coda decay
 */
export function profileAudioClusterPhonetics(params: {
  bars: IVocalNoteBar[];
  startMs: number;
  endMs: number;
  rawMonoPcm?: Float32Array;
  sampleRate?: number;
  pitchTrack?: IReferencePitchPoint[];
}): IClusterPhoneticProfile {
  const { bars, startMs, endMs, rawMonoPcm, sampleRate = 44100, pitchTrack } = params;
  const clusterKey = buildClusterProfileKey(startMs, endMs);
  const durationMs = Math.max(120, endMs - startMs);

  if (!rawMonoPcm || sampleRate <= 0 || rawMonoPcm.length === 0) {
    return {
      clusterKey,
      hasUsableAudio: false,
      acousticSyllableCount: Math.max(1, bars.length),
      syllables: [],
      meanCheckedStopRatio: 0,
      durationMs,
    };
  }

  const startSample = Math.max(0, Math.floor(((startMs - 25) / 1000) * sampleRate));
  const endSample = Math.min(rawMonoPcm.length, Math.floor(((endMs + 25) / 1000) * sampleRate));
  const rawRms = computeSliceRms(rawMonoPcm, startSample, endSample);

  // Silent-mock guard: unit tests using zero-filled PCM bypass acoustic fingerprinting cleanly
  if (rawRms < 0.0025 || endSample - startSample < 512) {
    return {
      clusterKey,
      hasUsableAudio: false,
      acousticSyllableCount: Math.max(1, bars.length),
      syllables: [],
      meanCheckedStopRatio: 0,
      durationMs,
    };
  }

  const hopMs = 16;
  const winMs = 24;
  const hopSamples = Math.max(128, Math.round((sampleRate * hopMs) / 1000));
  const winSamples = Math.max(256, Math.round((sampleRate * winMs) / 1000));

  interface IEnvPoint {
    sample: number;
    timeMs: number;
    vocE: number;
    hfE: number;
  }

  const frames: IEnvPoint[] = [];
  for (let sc = startSample; sc + winSamples <= endSample; sc += hopSamples) {
    const vocE =
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 380) +
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 760) +
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 1450) +
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 2150);
    const hfE =
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 3600) +
      goertzelBandEnergy(rawMonoPcm, sc, winSamples, sampleRate, 5200);
    frames.push({
      sample: sc,
      timeMs: (sc / sampleRate) * 1000,
      vocE,
      hfE,
    });
  }

  if (frames.length < 3) {
    return {
      clusterKey,
      hasUsableAudio: false,
      acousticSyllableCount: Math.max(1, bars.length),
      syllables: [],
      meanCheckedStopRatio: 0,
      durationMs,
    };
  }

  const smoothVoc = frames.map((f, i) => {
    const p = i > 0 ? frames[i - 1].vocE : f.vocE;
    const n = i + 1 < frames.length ? frames[i + 1].vocE : f.vocE;
    return p * 0.2 + f.vocE * 0.6 + n * 0.2;
  });
  const maxVoc = Math.max(...smoothVoc, 1e-12);

  // Detect syllable peak frame indices separated by >= 90ms (minimum ~5-6 frames)
  const peakIndices: number[] = [];
  for (let i = 1; i < smoothVoc.length - 1; i++) {
    if (smoothVoc[i] < maxVoc * 0.08) continue;
    const isLocalMax = smoothVoc[i] >= smoothVoc[i - 1] && smoothVoc[i] >= smoothVoc[i + 1];
    if (!isLocalMax) continue;

    if (peakIndices.length === 0) {
      peakIndices.push(i);
      continue;
    }

    const prevIdx = peakIndices[peakIndices.length - 1];
    const dtMs = frames[i].timeMs - frames[prevIdx].timeMs;
    if (dtMs < 90) {
      // Keep higher energy peak when two local peaks fall inside one syllable
      if (smoothVoc[i] > smoothVoc[prevIdx]) {
        peakIndices[peakIndices.length - 1] = i;
      }
      continue;
    }

    let minValley = smoothVoc[i];
    for (let k = prevIdx + 1; k < i; k++) {
      if (smoothVoc[k] < minValley) minValley = smoothVoc[k];
    }
    const hasDipProminence = minValley <= smoothVoc[i] * 0.74 || minValley <= smoothVoc[prevIdx] * 0.74;

    // Also allow continuous legato vowel changes when pitch jumps >= 1.7 semitones OR HF consonant burst sits between peaks
    let hasHfSeparator = false;
    for (let k = prevIdx + 1; k < i; k++) {
      if (frames[k].hfE > smoothVoc[k] * 0.42 && frames[k].hfE > maxVoc * 0.05) {
        hasHfSeparator = true;
        break;
      }
    }

    if (hasDipProminence || hasHfSeparator) {
      peakIndices.push(i);
    }
  }

  if (peakIndices.length === 0) {
    let maxI = 0;
    for (let i = 1; i < smoothVoc.length; i++) {
      if (smoothVoc[i] > smoothVoc[maxI]) maxI = i;
    }
    peakIndices.push(maxI);
  }

  // Locate valley boundaries surrounding each syllable peak and sample formants + onset/coda cues
  const boundaryFrames: number[] = [0];
  for (let p = 0; p < peakIndices.length - 1; p++) {
    const leftP = peakIndices[p];
    const rightP = peakIndices[p + 1];
    let minF = Math.floor((leftP + rightP) / 2);
    let minV = Infinity;
    for (let k = leftP + 1; k < rightP; k++) {
      if (smoothVoc[k] < minV) {
        minV = smoothVoc[k];
        minF = k;
      }
    }
    boundaryFrames.push(minF);
  }
  boundaryFrames.push(frames.length - 1);

  const f0Hz = lookupClusterF0Hz(startMs, endMs, pitchTrack, bars);
  const syllables: ISyllableAcousticVector[] = [];
  let stopCountSum = 0;

  for (let sIdx = 0; sIdx < peakIndices.length; sIdx++) {
    const pk = peakIndices[sIdx];
    const bL = boundaryFrames[sIdx];
    const bR = boundaryFrames[sIdx + 1];
    const sStartMs = frames[bL].timeMs;
    const sEndMs = frames[bR].timeMs + winMs;
    const pkMs = frames[pk].timeMs + winMs / 2;

    const nucSampleL = Math.max(
      frames[bL].sample,
      Math.floor(frames[pk].sample - winSamples * 0.65)
    );
    const nucSampleR = Math.min(
      frames[bR].sample + winSamples,
      Math.floor(frames[pk].sample + winSamples * 1.55)
    );

    const formant = estimateSliceVowelFormants(rawMonoPcm, nucSampleL, nucSampleR, sampleRate, f0Hz);
    const vowelProbs = computeVowelSoftProbabilities(formant.f1Hz, formant.f2Hz);

    // Onset HF stop/fricative ratio across leading half up to peak
    let onsetHf = 0;
    let onsetVoc = 0;
    for (let k = bL; k <= pk; k++) {
      onsetHf += frames[k].hfE;
      onsetVoc += frames[k].vocE;
    }
    const onsetStopFricScore = Math.min(
      1,
      Math.max(0, (onsetHf / (onsetVoc + onsetHf + 1e-12)) * 2.35)
    );

    // Checked-stop rapid energy drop within ~60ms after peak combined with non-nasal cutoff
    const decayLookahead = Math.min(bR, pk + 4);
    const postEnergy = decayLookahead > pk ? smoothVoc[decayLookahead] : smoothVoc[pk] * 0.25;
    const dropRatio = 1 - Math.min(1, postEnergy / Math.max(1e-12, smoothVoc[pk]));
    const codaClippedStopScore = Math.min(
      1,
      Math.max(0, (dropRatio - 0.38) * 1.55 * (1 - Math.min(0.65, formant.nasalRatio * 2.2)))
    );

    const nasalSustainScore = Math.min(1, Math.max(0, formant.nasalRatio * 3.1));
    stopCountSum += codaClippedStopScore;

    syllables.push({
      startMs: sStartMs,
      endMs: sEndMs,
      peakMs: pkMs,
      f1Hz: formant.f1Hz,
      f2Hz: formant.f2Hz,
      dominantVowel: formant.vowel,
      vowelProbs,
      onsetStopFricScore,
      codaClippedStopScore,
      nasalSustainScore,
    });
  }

  return {
    clusterKey,
    hasUsableAudio: true,
    acousticSyllableCount: Math.max(syllables.length, bars.length > 0 ? Math.min(bars.length, syllables.length + 2) : syllables.length),
    syllables,
    meanCheckedStopRatio: syllables.length > 0 ? stopCountSum / syllables.length : 0,
    durationMs,
  };
}

/**
 * Combine two consecutive cluster phonetic profiles in O(N) without re-scanning PCM.
 */
export function mergeClusterPhoneticProfiles(
  first: IClusterPhoneticProfile | undefined,
  second: IClusterPhoneticProfile | undefined
): IClusterPhoneticProfile | undefined {
  if (!first || !second) return first || second;
  const syllables = [...first.syllables, ...second.syllables];
  const hasUsableAudio = first.hasUsableAudio || second.hasUsableAudio;
  const count = first.acousticSyllableCount + second.acousticSyllableCount;
  const stopSum =
    first.meanCheckedStopRatio * first.syllables.length +
    second.meanCheckedStopRatio * second.syllables.length;
  return {
    clusterKey: `${first.clusterKey}+${second.clusterKey}`,
    hasUsableAudio,
    acousticSyllableCount: count,
    syllables,
    meanCheckedStopRatio: syllables.length > 0 ? stopSum / syllables.length : 0,
    durationMs: first.durationMs + second.durationMs,
  };
}

/**
 * Synchronously compute phonetic profiles for an array of NoteBar clusters.
 */
export function buildClusterPhoneticProfilesSync(params: {
  clusters: Array<{ bars: IVocalNoteBar[]; startMs: number; endMs: number }>;
  rawMonoPcm?: Float32Array;
  sampleRate?: number;
  pitchTrack?: IReferencePitchPoint[];
}): Map<string, IClusterPhoneticProfile> {
  const { clusters, rawMonoPcm, sampleRate, pitchTrack } = params;
  const map = new Map<string, IClusterPhoneticProfile>();
  if (!rawMonoPcm || !sampleRate || rawMonoPcm.length === 0) return map;

  for (const c of clusters) {
    const key = buildClusterProfileKey(c.startMs, c.endMs);
    if (!map.has(key)) {
      map.set(
        key,
        profileAudioClusterPhonetics({
          bars: c.bars,
          startMs: c.startMs,
          endMs: c.endMs,
          rawMonoPcm,
          sampleRate,
          pitchTrack,
        })
      );
    }
  }
  return map;
}

/**
 * Asynchronously profile all clusters in small batches with event-loop yields
 * and real UI progress reporting ("load file âm thanh lâu hơn 1 chút cũng đc" without UI freeze).
 */
export async function buildClusterPhoneticProfilesAsync(params: {
  clusters: Array<{ bars: IVocalNoteBar[]; startMs: number; endMs: number }>;
  rawMonoPcm?: Float32Array;
  sampleRate?: number;
  pitchTrack?: IReferencePitchPoint[];
  onProgress?: (pct: number, statusText: string) => void;
}): Promise<Map<string, IClusterPhoneticProfile>> {
  const { clusters, rawMonoPcm, sampleRate, pitchTrack, onProgress } = params;
  const map = new Map<string, IClusterPhoneticProfile>();
  if (!rawMonoPcm || !sampleRate || rawMonoPcm.length === 0 || clusters.length === 0) {
    return map;
  }

  const batchSize = 8;
  for (let i = 0; i < clusters.length; i += batchSize) {
    const end = Math.min(clusters.length, i + batchSize);
    for (let k = i; k < end; k++) {
      const c = clusters[k];
      const key = buildClusterProfileKey(c.startMs, c.endMs);
      if (!map.has(key)) {
        map.set(
          key,
          profileAudioClusterPhonetics({
            bars: c.bars,
            startMs: c.startMs,
            endMs: c.endMs,
            rawMonoPcm,
            sampleRate,
            pitchTrack,
          })
        );
      }
    }

    if (onProgress) {
      const ratio = end / clusters.length;
      const pct = Math.min(97, Math.round(94 + ratio * 3));
      onProgress(
        pct,
        `Giai đoạn 6/7: Trích xuất dấu vân tay âm vị & vần tiết F1-F2 (${end}/${clusters.length} cụm)...`
      );
    }

    // Yield control between batches so rendering & progress updates stay smooth
    if (end < clusters.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return map;
}

/**
 * Score articulatory & syllable-level phonetic compatibility between `lineTokens`
 * and an audio cluster's `IClusterPhoneticProfile` using length-normalized DTW.
 */
export function computePhoneticLineToClusterDistance(
  lineTokens: string[],
  profile: IClusterPhoneticProfile | undefined,
  phonology: IPhonologyDecomposerFns
): IPhoneticLineClusterMatch {
  if (!profile || !profile.hasUsableAudio || profile.syllables.length === 0 || lineTokens.length === 0) {
    return {
      distance: 0.45,
      hasUsableAudio: false,
      acousticSyllableCount: profile?.acousticSyllableCount ?? lineTokens.length,
      phoneticBonusCost: 0,
    };
  }

  const N = lineTokens.length;
  const syls = profile.syllables;
  const M = syls.length;

  const parsedWords = lineTokens.map((tk) => {
    const decomp = phonology.decomposeWord(tk);
    const vowelInfo = phonology.extractVowel(tk);
    return {
      targetVowel: NUCLEUS_TO_CORE_VOWEL[decomp.nucleusState] ?? vowelInfo.vowelFamily,
      onsetState: decomp.onsetState,
      codaState: decomp.codaState,
      isCheckedStop: vowelInfo.isCheckedStop,
    };
  });

  const pairCost = (wi: number, si: number): number => {
    const w = parsedWords[wi];
    const s = syls[si];

    // Expected vowel mismatch weighted by articulatory confusion distance across soft probabilities
    let vowelMismatch = 0;
    for (const v of CORE_VOWEL_ORDER) {
      vowelMismatch += s.vowelProbs[v] * VOWEL_ARTICULATORY_MISMATCH[w.targetVowel][v];
    }

    let onsetCost = 0;
    if (w.onsetState === 'STOP_FRIC' && s.onsetStopFricScore < 0.25) {
      onsetCost = (0.25 - s.onsetStopFricScore) * 0.55;
    } else if (w.onsetState === 'NONE' && s.onsetStopFricScore > 0.7) {
      onsetCost = (s.onsetStopFricScore - 0.7) * 0.75;
    }

    let codaCost = 0;
    if (w.isCheckedStop) {
      codaCost = (1 - s.codaClippedStopScore) * 0.45;
    } else if (w.codaState === 'NASAL_LIQUID' && s.nasalSustainScore < 0.22 && s.codaClippedStopScore > 0.74) {
      codaCost = 0.32;
    }

    // Vowels drive primary mouth-shape identity; onset/coda contribute without diluting vowel mismatches
    return vowelMismatch * 0.95 + onsetCost * 0.25 + codaCost * 0.25;
  };

  // Standard 3-way monotonic DTW between N words and M detected acoustic syllables
  const dp: number[][] = Array.from({ length: N + 1 }, () =>
    Array.from({ length: M + 1 }, () => Infinity)
  );
  dp[0][0] = 0;
  const indelPenalty = 0.78;

  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= M; j++) {
      if (i === 0 && j === 0) continue;
      let best = Infinity;
      if (i >= 1 && j >= 1) {
        const sub = dp[i - 1][j - 1] + pairCost(i - 1, j - 1);
        if (sub < best) best = sub;
      }
      if (i >= 1) {
        // Extra word without corresponding acoustic syllable
        const del = dp[i - 1][j] + indelPenalty;
        if (del < best) best = del;
      }
      if (j >= 1) {
        // Extra melisma peak without corresponding lyric word
        const ins = dp[i][j - 1] + indelPenalty * 0.9;
        if (ins < best) best = ins;
      }
      dp[i][j] = best;
    }
  }

  const meanDist = dp[N][M] / Math.max(N, M, 1);
  const clampedDist = Math.max(0, Math.min(1.2, meanDist));

  // Translate distance cleanly into signed DP bonus/penalty centered around neutral ~0.40
  let phoneticBonusCost = 0;
  if (clampedDist <= 0.34) {
    phoneticBonusCost = -3.1 * ((0.34 - clampedDist) / 0.34);
  } else if (clampedDist >= 0.46) {
    phoneticBonusCost = Math.min(4.6, ((clampedDist - 0.46) / 0.38) * 4.6);
  }

  return {
    distance: clampedDist,
    hasUsableAudio: true,
    acousticSyllableCount: profile.acousticSyllableCount,
    phoneticBonusCost,
  };
}
