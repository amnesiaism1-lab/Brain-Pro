/**
 * Vocal File Analysis Service (vocalFileAnalysisService.ts)
 * 
 * Provides offline audio decoding and pitch extraction for imported vocal files (MP3, WAV, etc.)
 * using McLeod Pitch Method (MPM) via the `pitchy` library.
 * Analyzes vocal range, key/tonality, phrases, difficulty, and automatically generates
 * a tailored practice plan for singing along with real-time pitch accuracy tracking.
 */

import { PitchDetector } from 'pitchy';
import { auditoryEngine } from './auditoryEngine';
import { getNoteFrequency } from './musicTheoryService';
import { NOTE_NAMES, SOLFEGE_NAMES, midiToNoteInfo } from '@brain-exercises/shared';

export interface IReferencePitchPoint {
  timeMs: number;
  freqHz: number;
  midi: number;
  noteName: string;
  solfegeName: string;
  clarity: number;
  volumeDb: number;
  isVocal: boolean;
}

export interface IVocalPhrase {
  id: string;
  phraseIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  notes: string[];             // Distinct notes sung in this phrase
  lowestNote: string;
  highestNote: string;
  avgPitchHz: number;
  avgMidi: number;
  pitchJumpSemitones: number;  // Max leap within phrase
  difficulty: 'Dễ' | 'Trung bình' | 'Thử thách';
  difficultyScore: number;     // 1..10
  pointsCount: number;
}

export interface IVocalPracticeStep {
  stepNumber: number;
  title: string;
  type: 'listen' | 'phrase_loop' | 'slow_sing' | 'full_challenge';
  targetPhraseIndex?: number;
  targetTempo: number; // 0.75, 0.85, 1.0
  description: string;
  focusNotes?: string[];
}

export interface IVocalPracticePlan {
  title: string;
  summaryVi: string;
  recommendedSteps: IVocalPracticeStep[];
}

export interface IVocalAnalysisResult {
  fileName: string;
  durationMs: number;
  sampleRate: number;
  audioBuffer: AudioBuffer;
  audioBlobUrl: string;
  pitchTrack: IReferencePitchPoint[];
  phrases: IVocalPhrase[];

  vocalRange: {
    lowestNote: string;
    lowestFreqHz: number;
    lowestMidi: number;
    highestNote: string;
    highestFreqHz: number;
    highestMidi: number;
    spanSemitones: number;
    recommendedVoiceType: 'Bass' | 'Baritone' | 'Tenor' | 'Alto' | 'Soprano';
  };

  estimatedKey: {
    key: string;              // e.g. "Đô Trưởng (C Major)"
    root: string;             // "C"
    mode: 'major' | 'minor';
    confidence: number;       // 0..1
    scaleNotes: string[];     // ["C", "D", "E", "F", "G", "A", "B"]
  };

  vocalMetrics: {
    singingTimeMs: number;
    singingRatioPercent: number;
    avgClarity: number;
    avgRmsDb: number;
    densityNotesPerSec: number;
    maxIntervalSemitones: number;
    overallDifficulty: 'Dễ' | 'Trung bình' | 'Thử thách' | 'Nâng cao';
  };

  practicePlan: IVocalPracticePlan;
}

// Krumhansl-Kessler key profile weights for key determination
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

class VocalFileAnalysisService {
  /**
   * Decode an imported audio File, Blob, or ArrayBuffer and perform comprehensive pitch extraction
   */
  public async analyzeVocalAudio(
    fileOrBuffer: File | Blob | ArrayBuffer,
    fileName = 'audio-vocal.mp3',
    onProgress?: (progressPercent: number, statusText: string) => void
  ): Promise<IVocalAnalysisResult> {
    const notify = (pct: number, msg: string) => {
      if (onProgress) onProgress(pct, msg);
    };

    notify(5, 'Đang giải mã âm thanh file MP3/WAV...');

    // 1. Prepare ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    let blobUrl = '';
    if (fileOrBuffer instanceof File) {
      fileName = fileOrBuffer.name;
      blobUrl = URL.createObjectURL(fileOrBuffer);
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Blob) {
      blobUrl = URL.createObjectURL(fileOrBuffer);
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = fileOrBuffer;
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      blobUrl = URL.createObjectURL(blob);
    }

    // 2. Decode AudioData with Web Audio API
    const ctx = auditoryEngine.initContext();
    if (!ctx) throw new Error('Web Audio API không khả dụng trên trình duyệt này');

    // Clone arrayBuffer because decodeAudioData detaches the buffer on some platforms
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await ctx.decodeAudioData(bufferCopy);

    notify(25, 'Đang trích xuất đường cao độ vocal bằng thuật toán MPM...');

    // 3. Offline Pitch Extraction using Pitchy MPM
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // Mono or left channel
    const totalSamples = channelData.length;
    const durationMs = Math.round((totalSamples / sampleRate) * 1000);

    const bufferSize = 2048;
    const hopSize = 1024; // ~23ms hop step for detailed pitch curve
    const detector = PitchDetector.forFloat32Array(bufferSize);
    detector.clarityThreshold = 0.60;

    const pitchTrack: IReferencePitchPoint[] = [];
    const frameBuffer = new Float32Array(bufferSize);

    // Calculate ambient noise floor
    let maxRms = 0;
    for (let i = 0; i < totalSamples; i += 2048) {
      let sqSum = 0;
      const chunkLen = Math.min(2048, totalSamples - i);
      for (let j = 0; j < chunkLen; j++) {
        const val = channelData[i + j];
        sqSum += val * val;
      }
      const r = Math.sqrt(sqSum / chunkLen);
      if (r > maxRms) maxRms = r;
    }
    const dynamicNoiseFloorRms = Math.max(0.008, maxRms * 0.05);

    let sampleCursor = 0;
    const totalFrames = Math.floor((totalSamples - bufferSize) / hopSize);
    let frameCount = 0;

    while (sampleCursor + bufferSize <= totalSamples) {
      const timeMs = Math.round((sampleCursor / sampleRate) * 1000);

      // Extract window
      let sumSquares = 0;
      for (let j = 0; j < bufferSize; j++) {
        const val = channelData[sampleCursor + j];
        frameBuffer[j] = val;
        sumSquares += val * val;
      }

      const rms = Math.sqrt(sumSquares / bufferSize);
      const db = rms > 0 ? 20 * Math.log10(rms) : -100;

      if (rms >= dynamicNoiseFloorRms && db >= -45) {
        const [rawPitch, clarity] = detector.findPitch(frameBuffer, sampleRate);

        // Vocal singing frequencies typically range between 80Hz (E2) and 1150Hz (D6)
        if (clarity >= 0.62 && rawPitch >= 80 && rawPitch <= 1150) {
          const exactMidi = 12 * Math.log2(rawPitch / 440) + 69;
          const noteInfo = this.midiToNoteInfo(exactMidi);

          pitchTrack.push({
            timeMs,
            freqHz: Math.round(rawPitch * 10) / 10,
            midi: Math.round(exactMidi * 100) / 100,
            noteName: noteInfo.noteName,
            solfegeName: noteInfo.solfegeName,
            clarity: Math.round(clarity * 100) / 100,
            volumeDb: Math.round(db),
            isVocal: true,
          });
        } else {
          pitchTrack.push({
            timeMs,
            freqHz: 0,
            midi: 0,
            noteName: '',
            solfegeName: '',
            clarity: Math.round(clarity * 100) / 100,
            volumeDb: Math.round(db),
            isVocal: false,
          });
        }
      } else {
        pitchTrack.push({
          timeMs,
          freqHz: 0,
          midi: 0,
          noteName: '',
          solfegeName: '',
          clarity: 0,
          volumeDb: Math.round(db),
          isVocal: false,
        });
      }

      sampleCursor += hopSize;
      frameCount++;

      if (frameCount % 100 === 0 && totalFrames > 0) {
        const pct = Math.min(80, 25 + Math.round((frameCount / totalFrames) * 55));
        notify(pct, `Đang phân tích cao độ (${Math.round((timeMs / 1000))}s / ${Math.round(durationMs / 1000)}s)...`);
      }
    }

    notify(85, 'Đang phân đoạn câu hát và xác định giọng điệu (Key & Scale)...');

    // 4. Robust Vocal Range & Statistics via 5th-95th percentile filtering
    const vocalPoints = pitchTrack.filter((p) => p.isVocal && p.freqHz > 0);
    let lowestPoint: IReferencePitchPoint;
    let highestPoint: IReferencePitchPoint;
    let spanSemitones = 0;
    let claritySum = 0;
    let rmsDbSum = 0;

    if (vocalPoints.length === 0) {
      lowestPoint = { timeMs: 0, freqHz: 261.63, midi: 60, noteName: 'C4', solfegeName: 'Đô 4', clarity: 1, volumeDb: -20, isVocal: true };
      highestPoint = { timeMs: 1000, freqHz: 392.00, midi: 67, noteName: 'G4', solfegeName: 'Sol 4', clarity: 1, volumeDb: -20, isVocal: true };
      spanSemitones = 7;
    } else {
      vocalPoints.forEach((p) => {
        claritySum += p.clarity;
        rmsDbSum += p.volumeDb;
      });

      // Sort by MIDI to eliminate transient cough/mic clicks at boundaries
      const sorted = [...vocalPoints].sort((a, b) => a.midi - b.midi);
      const p5Index = Math.min(sorted.length - 1, Math.max(sorted.length > 10 ? 1 : 0, Math.floor(sorted.length * 0.05)));
      const p95Index = Math.max(0, Math.min(sorted.length > 10 ? sorted.length - 2 : sorted.length - 1, Math.ceil(sorted.length * 0.95)));
      lowestPoint = sorted[p5Index];
      highestPoint = sorted[p95Index];
      spanSemitones = Math.max(1, Math.round(highestPoint.midi - lowestPoint.midi));
    }

    const recommendedVoiceType = this.classifyVoiceType(lowestPoint.freqHz, highestPoint.freqHz);

    // 5. Key & Scale Estimation using Pitch Class Chroma Histogram
    const estimatedKey = this.estimateKeyAndScale(vocalPoints);

    notify(92, 'Đang phân đoạn câu hát và tối ưu lộ trình luyện tập...');

    // 6. Phrase Segmentation (Tách từng câu hát)
    const phrases = this.segmentPhrases(pitchTrack);

    // 7. Calculate Vocal Complexity Metrics
    const singingTimeMs = vocalPoints.length * (hopSize / sampleRate) * 1000;
    const singingRatioPercent = durationMs > 0 ? Math.round((singingTimeMs / durationMs) * 100) : 0;
    const avgClarity = vocalPoints.length > 0 ? Math.round((claritySum / vocalPoints.length) * 100) / 100 : 0.75;
    const avgRmsDb = vocalPoints.length > 0 ? Math.round(rmsDbSum / vocalPoints.length) : -25;
    const densityNotesPerSec = durationMs > 0 ? Math.round((vocalPoints.length / (durationMs / 1000)) * 10) / 10 : 0;

    // Calculate musical leaps between sustained note events (not micro-frames 23ms apart)
    let maxIntervalSemitones = 0;
    let lastStableMidi = vocalPoints.length > 0 ? vocalPoints[0].midi : 0;
    for (let i = 1; i < vocalPoints.length; i++) {
      const semitonesDiff = Math.abs(vocalPoints[i].midi - lastStableMidi);
      if (semitonesDiff >= 1.0 && semitonesDiff < 24) {
        if (semitonesDiff > maxIntervalSemitones) {
          maxIntervalSemitones = Math.round(semitonesDiff);
        }
        lastStableMidi = vocalPoints[i].midi;
      }
    }

    let overallDifficulty: 'Dễ' | 'Trung bình' | 'Thử thách' | 'Nâng cao' = 'Trung bình';
    if (spanSemitones <= 12 && maxIntervalSemitones <= 4) {
      overallDifficulty = 'Dễ';
    } else if (spanSemitones <= 19 && maxIntervalSemitones <= 7) {
      overallDifficulty = 'Trung bình';
    } else if (spanSemitones <= 24 || maxIntervalSemitones <= 10) {
      overallDifficulty = 'Thử thách';
    } else {
      overallDifficulty = 'Nâng cao';
    }

    // 8. Generate Tailored 3-Phase Practice Plan
    const practicePlan = this.generatePracticePlan(
      fileName,
      estimatedKey,
      phrases,
      spanSemitones,
      lowestPoint.noteName,
      highestPoint.noteName
    );

    notify(100, 'Hoàn thành phân tích! Sẵn sàng vào phòng luyện.');

    return {
      fileName,
      durationMs,
      sampleRate,
      audioBuffer,
      audioBlobUrl: blobUrl,
      pitchTrack,
      phrases,
      vocalRange: {
        lowestNote: lowestPoint.noteName,
        lowestFreqHz: lowestPoint.freqHz,
        lowestMidi: Math.round(lowestPoint.midi),
        highestNote: highestPoint.noteName,
        highestFreqHz: highestPoint.freqHz,
        highestMidi: Math.round(highestPoint.midi),
        spanSemitones,
        recommendedVoiceType,
      },
      estimatedKey,
      vocalMetrics: {
        singingTimeMs: Math.round(singingTimeMs),
        singingRatioPercent,
        avgClarity,
        avgRmsDb,
        densityNotesPerSec,
        maxIntervalSemitones,
        overallDifficulty,
      },
      practicePlan,
    };
  }

  /**
   * Segment pitch timeline into discrete vocal phrases separated by breath pauses
   */
  private segmentPhrases(pitchTrack: IReferencePitchPoint[]): IVocalPhrase[] {
    const phrases: IVocalPhrase[] = [];
    let inPhrase = false;
    let currentPoints: IReferencePitchPoint[] = [];
    let phraseIndex = 1;
    let silenceCounter = 0;
    const maxSilenceFrames = 12; // ~280ms of silence closes a phrase

    for (let i = 0; i < pitchTrack.length; i++) {
      const p = pitchTrack[i];

      if (p.isVocal && p.freqHz > 0) {
        silenceCounter = 0;
        inPhrase = true;
        currentPoints.push(p);
      } else if (inPhrase) {
        silenceCounter++;
        if (silenceCounter >= maxSilenceFrames || i === pitchTrack.length - 1) {
          // Finish current phrase if it lasted at least 350ms
          const vocalOnly = currentPoints.filter((pt) => pt.isVocal && pt.freqHz > 0);
          if (vocalOnly.length >= 10) {
            const startMs = vocalOnly[0].timeMs;
            const endMs = vocalOnly[vocalOnly.length - 1].timeMs;
            const durationMs = endMs - startMs;

            const distinctNotes = Array.from(new Set(vocalOnly.map((pt) => pt.noteName)));
            let lowestM = 999;
            let highestM = -999;
            let lowestN = vocalOnly[0].noteName;
            let highestN = vocalOnly[0].noteName;
            let midiSum = 0;
            let maxLeap = 0;

            for (let j = 0; j < vocalOnly.length; j++) {
              const pt = vocalOnly[j];
              midiSum += pt.midi;
              if (pt.midi < lowestM) {
                lowestM = pt.midi;
                lowestN = pt.noteName;
              }
              if (pt.midi > highestM) {
                highestM = pt.midi;
                highestN = pt.noteName;
              }
              if (j > 0) {
                const leap = Math.abs(pt.midi - vocalOnly[j - 1].midi);
                if (leap > maxLeap && leap < 24) maxLeap = leap;
              }
            }

            const rangeSpan = Math.round(highestM - lowestM);
            let difficulty: 'Dễ' | 'Trung bình' | 'Thử thách' = 'Dễ';
            let diffScore = 3;

            if (rangeSpan > 12 || maxLeap > 7 || durationMs > 5000) {
              difficulty = 'Thử thách';
              diffScore = 8;
            } else if (rangeSpan > 7 || maxLeap > 4 || durationMs > 3000) {
              difficulty = 'Trung bình';
              diffScore = 5;
            }

            phrases.push({
              id: `phrase-${phraseIndex}`,
              phraseIndex,
              startMs,
              endMs,
              durationMs,
              notes: distinctNotes.slice(0, 8),
              lowestNote: lowestN,
              highestNote: highestN,
              avgPitchHz: Math.round(440 * Math.pow(2, (midiSum / vocalOnly.length - 69) / 12)),
              avgMidi: Math.round((midiSum / vocalOnly.length) * 10) / 10,
              pitchJumpSemitones: Math.round(maxLeap),
              difficulty,
              difficultyScore: diffScore,
              pointsCount: vocalOnly.length,
            });
            phraseIndex++;
          }

          inPhrase = false;
          currentPoints = [];
          silenceCounter = 0;
        }
      }
    }

    return phrases;
  }

  /**
   * Krumhansl-Schmuckler Key-Finding Algorithm
   */
  private estimateKeyAndScale(vocalPoints: IReferencePitchPoint[]): {
    key: string;
    root: string;
    mode: 'major' | 'minor';
    confidence: number;
    scaleNotes: string[];
  } {
    if (vocalPoints.length === 0) {
      return {
        key: 'Đô Trưởng (C Major)',
        root: 'C',
        mode: 'major',
        confidence: 0.85,
        scaleNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      };
    }

    // 12 Pitch Classes
    const chromaWeights = new Array(12).fill(0);
    vocalPoints.forEach((p) => {
      const pitchClass = Math.round(p.midi) % 12;
      chromaWeights[pitchClass] += p.clarity;
    });

    let bestCorrelation = -999;
    let bestRootIndex = 0;
    let bestMode: 'major' | 'minor' = 'major';

    for (let root = 0; root < 12; root++) {
      // Rotate profiles
      const majorRotated = new Array(12);
      const minorRotated = new Array(12);
      for (let i = 0; i < 12; i++) {
        majorRotated[i] = MAJOR_PROFILE[(i - root + 12) % 12];
        minorRotated[i] = MINOR_PROFILE[(i - root + 12) % 12];
      }

      const majorCorr = this.pearsonCorrelation(chromaWeights, majorRotated);
      const minorCorr = this.pearsonCorrelation(chromaWeights, minorRotated);

      if (majorCorr > bestCorrelation) {
        bestCorrelation = majorCorr;
        bestRootIndex = root;
        bestMode = 'major';
      }
      if (minorCorr > bestCorrelation) {
        bestCorrelation = minorCorr;
        bestRootIndex = root;
        bestMode = 'minor';
      }
    }

    const rootName = NOTE_NAMES[bestRootIndex];
    const solfegeRoot = SOLFEGE_NAMES[bestRootIndex];
    const keyNameVi = bestMode === 'major' 
      ? `${solfegeRoot} Trưởng (${rootName} Major)` 
      : `${solfegeRoot} Thứ (${rootName} Minor)`;

    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
    const intervals = bestMode === 'major' ? majorIntervals : minorIntervals;
    const scaleNotes = intervals.map((int) => NOTE_NAMES[(bestRootIndex + int) % 12]);

    // Statistical confidence based on correlation strength
    const confidence = Math.max(0.40, Math.min(0.98, (bestCorrelation + 1) * 0.45));

    return {
      key: keyNameVi,
      root: rootName,
      mode: bestMode,
      confidence: Math.round(confidence * 100) / 100,
      scaleNotes,
    };
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  private classifyVoiceType(minHz: number, maxHz: number): 'Bass' | 'Baritone' | 'Tenor' | 'Alto' | 'Soprano' {
    if (maxHz <= 330) return 'Bass';
    if (maxHz <= 440) return 'Baritone';
    if (maxHz <= 550) return 'Tenor';
    if (maxHz <= 700) return 'Alto';
    return 'Soprano';
  }

  private midiToNoteInfo(midi: number): { noteName: string; solfegeName: string } {
    const chosenMidi = Math.round(midi);
    const noteIndex = ((chosenMidi % 12) + 12) % 12;
    const octave = Math.floor(chosenMidi / 12) - 1;
    return {
      noteName: `${NOTE_NAMES[noteIndex]}${octave}`,
      solfegeName: `${SOLFEGE_NAMES[noteIndex]} ${octave}`,
    };
  }

  /**
   * Automatically generate a tailored 3-phase practice roadmap
   */
  private generatePracticePlan(
    fileName: string,
    keyInfo: { key: string; root: string; scaleNotes: string[] },
    phrases: IVocalPhrase[],
    spanSemitones: number,
    lowestNote: string,
    highestNote: string
  ): IVocalPracticePlan {
    const steps: IVocalPracticeStep[] = [];
    let stepNum = 1;

    // Step 1: Listen & Pitch Mapping
    steps.push({
      stepNumber: stepNum++,
      title: 'Bước 1: Cảm Nhận & Định Vị Cao Độ',
      type: 'listen',
      targetTempo: 1.0,
      description: `Lắng nghe toàn bộ bản thu vocal, quan sát đường băng cao độ ở Tone ${keyInfo.key}. Quãng giọng bài này kéo dài từ ${lowestNote} đến ${highestNote} (${spanSemitones} bán âm).`,
      focusNotes: keyInfo.scaleNotes.slice(0, 5),
    });

    // Step 2: Practice Challenging Phrases (only if song has multiple phrases or a difficult segment)
    const challengingPhrases = phrases.filter((p) => p.difficulty === 'Thử thách');
    const moderatePhrases = phrases.filter((p) => p.difficulty === 'Trung bình');
    const priorityPhrase = challengingPhrases[0] || moderatePhrases[0] || (phrases.length > 1 ? phrases[0] : null);

    if (priorityPhrase) {
      // Filter focus notes to scale notes to eliminate octave-glitch artifacts
      const validNotes = priorityPhrase.notes.filter((n) => keyInfo.scaleNotes.some((sn) => n.startsWith(sn)));
      const cleanNotes = validNotes.length > 0 ? validNotes : priorityPhrase.notes;

      steps.push({
        stepNumber: stepNum++,
        title: `Bước 2: Luyện Tách Câu Khó (Câu ${priorityPhrase.phraseIndex}) Chậm 0.75x`,
        type: 'phrase_loop',
        targetPhraseIndex: priorityPhrase.phraseIndex,
        targetTempo: 0.75,
        description: `Câu ${priorityPhrase.phraseIndex} (${priorityPhrase.lowestNote} đến ${priorityPhrase.highestNote}) có bước nhảy cao độ ${priorityPhrase.pitchJumpSemitones} bán âm. Bật chế độ A-B Loop và tập chậm với tốc độ 0.75x để nắm chắc cao độ.`,
        focusNotes: cleanNotes,
      });
    }

    // Step 3: Slow Full-Run
    steps.push({
      stepNumber: stepNum++,
      title: 'Bước 3: Hát Theo Chậm (Tempo 0.85x)',
      type: 'slow_sing',
      targetTempo: 0.85,
      description: 'Hát theo toàn bài với nhịp chậm 0.85x. Tập trung giữ cao độ ổn định trên thanh đo Tuner Cents và giữ thanh tiến trình màu xanh ngọc.',
    });

    // Step 4: Full-Speed Vocal Mastery
    steps.push({
      stepNumber: stepNum++,
      title: 'Bước 4: Thử Thách Hát Chuẩn Tông 100% (Full Speed 1.0x)',
      type: 'full_challenge',
      targetTempo: 1.0,
      description: 'Hát theo toàn bài ở tốc độ nguyên bản (1.0x) với micro bật. Chinh phục điểm số Chuẩn Tông > 85% và xem báo cáo phân tích chi tiết.',
    });

    return {
      title: `Kế Hoạch Luyện Hát: ${fileName.replace(/\.[^/.]+$/, '')}`,
      summaryVi: `Bài hát ở ${keyInfo.key}, quãng ${spanSemitones} bán âm (${lowestNote} – ${highestNote}). Lộ trình 4 bước từ làm quen, luyện chậm câu khó đến làm chủ toàn bài.`,
      recommendedSteps: steps,
    };
  }

  /**
   * Synthesize high-quality built-in vocal demo tracks
   * Allows the user to test vocal file analysis immediately without needing an external MP3 file!
   */
  public async generateDemoVocalTrack(type: 'scale' | 'ballad' | 'pentatonic'): Promise<{
    file: Blob;
    name: string;
    buffer: AudioBuffer;
  }> {
    const sampleRate = 44100;
    const ctx = auditoryEngine.initContext() || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    let melodyNotes: Array<{ note: string; durSec: number }> = [];
    let trackName = 'Luyện_Thanh_Khởi_Động_Đô_Trưởng.wav';

    if (type === 'scale') {
      trackName = 'Luyện_Thanh_Do_Truong_C3_G4.wav';
      melodyNotes = [
        { note: 'C3', durSec: 0.9 },
        { note: 'E3', durSec: 0.8 },
        { note: 'G3', durSec: 0.8 },
        { note: 'C4', durSec: 1.2 },
        { note: 'E4', durSec: 0.9 },
        { note: 'G4', durSec: 1.4 },
        { note: 'E4', durSec: 0.8 },
        { note: 'C4', durSec: 1.0 },
        { note: 'G3', durSec: 0.8 },
        { note: 'C3', durSec: 1.6 },
      ];
    } else if (type === 'ballad') {
      trackName = 'Giai_Dieu_Ballad_F3_C5.wav';
      melodyNotes = [
        { note: 'F3', durSec: 1.0 },
        { note: 'A3', durSec: 0.8 },
        { note: 'C4', durSec: 1.2 },
        { note: 'D4', durSec: 0.9 },
        { note: 'F4', durSec: 1.4 },
        { note: 'G4', durSec: 0.9 },
        { note: 'A4', durSec: 1.6 },
        { note: 'C5', durSec: 1.8 },
        { note: 'A4', durSec: 1.0 },
        { note: 'F4', durSec: 1.2 },
        { note: 'C4', durSec: 1.5 },
      ];
    } else {
      trackName = 'Thang_Am_Ngu_Cung_Viet_Nam.wav';
      melodyNotes = [
        { note: 'D3', durSec: 0.9 },
        { note: 'F3', durSec: 0.8 },
        { note: 'G3', durSec: 1.0 },
        { note: 'A3', durSec: 1.1 },
        { note: 'C4', durSec: 1.3 },
        { note: 'D4', durSec: 1.5 },
        { note: 'F4', durSec: 1.1 },
        { note: 'D4', durSec: 1.0 },
        { note: 'A3', durSec: 1.2 },
        { note: 'D3', durSec: 1.8 },
      ];
    }

    const totalDurationSec = melodyNotes.reduce((acc, curr) => acc + curr.durSec + 0.15, 0) + 1.0;
    const totalFrames = Math.ceil(sampleRate * totalDurationSec);

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, totalFrames, sampleRate);
    const channel = audioBuffer.getChannelData(0);

    let currentFrame = 0;
    melodyNotes.forEach((item) => {
      const freq = getNoteFrequency(item.note) || 261.63;
      const noteFrames = Math.floor(item.durSec * sampleRate);

      // Synthesize realistic vocal timbre with warm harmonics & formant filtering
      for (let f = 0; f < noteFrames; f++) {
        const t = f / sampleRate;
        const progress = f / noteFrames;

        // Envelope: 80ms attack, 100ms release
        let env = 1.0;
        if (progress < 0.08) env = progress / 0.08;
        else if (progress > 0.88) env = (1.0 - progress) / 0.12;

        // Vocal vibrato: 5.5 Hz modulation after 250ms
        const vibratoDelay = Math.max(0, Math.min(1, (t - 0.25) / 0.4));
        const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * (freq * 0.015) * vibratoDelay;
        const modulatedFreq = freq + vibrato;

        // Harmonics with balanced formant profile
        const fundamental = Math.sin(2 * Math.PI * modulatedFreq * t);
        const secondHarmonic = Math.sin(2 * Math.PI * (modulatedFreq * 2) * t) * 0.35;
        const thirdHarmonic = Math.sin(2 * Math.PI * (modulatedFreq * 3) * t) * 0.18;
        const fourthHarmonic = Math.sin(2 * Math.PI * (modulatedFreq * 4) * t) * 0.08;

        const sampleVal = (fundamental + secondHarmonic + thirdHarmonic + fourthHarmonic) * 0.35 * env;
        if (currentFrame + f < totalFrames) {
          channel[currentFrame + f] += sampleVal;
        }
      }

      currentFrame += noteFrames + Math.floor(0.25 * sampleRate); // breath pause (250ms)
    });

    // Convert AudioBuffer to WAV Blob
    const wavBlob = this.audioBufferToWavBlob(audioBuffer);
    return {
      file: wavBlob,
      name: trackName,
      buffer: audioBuffer,
    };
  }

  /**
   * Helper to encode Float32Array AudioBuffer to standard WAV Blob
   */
  private audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels: Float32Array[] = [];
    let sampleRate = audioBuffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF chunk
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // Subchunk1Size (16 for PCM)
    setUint16(1);  // AudioFormat (1 = PCM)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // ByteRate
    setUint16(numOfChan * 2); // BlockAlign
    setUint16(16); // BitsPerSample

    // Data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }
}

export const vocalFileAnalysisService = new VocalFileAnalysisService();
