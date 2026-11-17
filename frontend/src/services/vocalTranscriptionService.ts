import {
  alignLrcLinesToPhrases,
  alignWordsToPhraseNoteBars,
  auditLyricAlignmentHealth,
  classifyPhraseSectionsAndContours,
  saveLyricsToLocalCache,
  type ILrcLine,
} from './lyricAlignmentService';
import type { IVocalAnalysisResult, IVocalPhrase } from './vocalFileAnalysisService';

const GEMINI_KEY_STORAGE = 'be_vocal_studio_gemini_key';

export function getSavedGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // ignore
  }
}

/**
 * Downsample an AudioBuffer slice [startMs, endMs] into a compact 16kHz Mono 16-bit WAV Base64 string.
 * 35 seconds at 16kHz Mono 16-bit is only ~1.12 MB, safely under Vercel's 4.5MB Serverless payload limit.
 */
export function encodeAudioSliceTo16kWavBase64(
  audioBuffer: AudioBuffer,
  startMs: number,
  endMs: number
): string {
  const srcRate = audioBuffer.sampleRate;
  const targetRate = 16000;
  const srcStart = Math.max(0, Math.floor((startMs / 1000) * srcRate));
  const srcEnd = Math.min(audioBuffer.length, Math.ceil((endMs / 1000) * srcRate));
  const srcLen = Math.max(1, srcEnd - srcStart);

  // Mix channels to mono
  const numChannels = audioBuffer.numberOfChannels;
  const mono = new Float32Array(srcLen);
  for (let ch = 0; ch < numChannels; ch++) {
    const chData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < srcLen; i++) {
      mono[i] += chData[srcStart + i] / numChannels;
    }
  }

  // Linear downsample to 16kHz
  const ratio = srcRate / targetRate;
  const targetLen = Math.max(1, Math.floor(srcLen / ratio));
  const buffer = new ArrayBuffer(44 + targetLen * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + targetLen * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, targetLen * 2, true);

  let offset = 44;
  for (let i = 0; i < targetLen; i++) {
    const srcIdx = Math.min(srcLen - 1, i * ratio);
    const idx0 = Math.floor(srcIdx);
    const idx1 = Math.min(srcLen - 1, idx0 + 1);
    const frac = srcIdx - idx0;
    const sample = mono[idx0] * (1 - frac) + mono[idx1] * frac;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export interface IPhraseAudioChunk {
  startMs: number;
  endMs: number;
  phrases: IVocalPhrase[];
}

export function groupPhrasesIntoAudioChunks(
  phrases: IVocalPhrase[],
  durationMs: number,
  maxChunkMs = 34000
): IPhraseAudioChunk[] {
  const vocalPhrases = phrases.filter((p) => !p.isInstrumentalOrVocalize);
  if (vocalPhrases.length === 0) {
    const chunks: IPhraseAudioChunk[] = [];
    for (let s = 0; s < durationMs; s += maxChunkMs) {
      chunks.push({
        startMs: s,
        endMs: Math.min(durationMs, s + maxChunkMs),
        phrases: [],
      });
    }
    return chunks;
  }

  const chunks: IPhraseAudioChunk[] = [];
  let curStart = Math.max(0, vocalPhrases[0].startMs - 300);
  let curEnd = Math.min(durationMs, vocalPhrases[0].endMs + 300);
  let curPhrases: IVocalPhrase[] = [vocalPhrases[0]];

  for (let i = 1; i < vocalPhrases.length; i++) {
    const p = vocalPhrases[i];
    const nextEnd = Math.min(durationMs, p.endMs + 300);
    if (nextEnd - curStart <= maxChunkMs && p.startMs - curEnd <= 8000) {
      curEnd = nextEnd;
      curPhrases.push(p);
    } else {
      chunks.push({ startMs: curStart, endMs: curEnd, phrases: curPhrases });
      curStart = Math.max(0, p.startMs - 300);
      curEnd = nextEnd;
      curPhrases = [p];
    }
  }
  chunks.push({ startMs: curStart, endMs: curEnd, phrases: curPhrases });
  return chunks;
}

export async function transcribeAndAlignWithAI(params: {
  analysisResult: IVocalAnalysisResult;
  hintLyrics?: string;
  language?: 'vi' | 'en';
  apiKey?: string;
  onProgress?: (pct: number, status: string) => void;
}): Promise<IVocalAnalysisResult> {
  const { analysisResult, hintLyrics, language = 'vi', apiKey, onProgress } = params;
  const effectiveKey = (apiKey || getSavedGeminiApiKey()).trim();

  const chunks = groupPhrasesIntoAudioChunks(
    analysisResult.phrases,
    analysisResult.durationMs
  );

  const allLrcLines: ILrcLine[] = [];
  const rawMonoPcm =
    typeof analysisResult.audioBuffer?.getChannelData === 'function'
      ? analysisResult.audioBuffer.getChannelData(0)
      : null;

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    if (onProgress) {
      onProgress(
        Math.round(((idx + 0.2) / chunks.length) * 85),
        `Đang phân tích âm thanh & khớp từng chữ bằng AI (Đoạn ${idx + 1}/${chunks.length})...`
      );
    }

    const wavBase64 = encodeAudioSliceTo16kWavBase64(
      analysisResult.audioBuffer,
      chunk.startMs,
      chunk.endMs
    );

    const res = await fetch('/api/vocal-studio/align-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveKey ? { 'x-gemini-api-key': effectiveKey } : {}),
      },
      body: JSON.stringify({
        audioBase64: wavBase64,
        mimeType: 'audio/wav',
        language,
        hintLyrics,
        chunkOffsetMs: chunk.startMs,
        phraseHints: chunk.phrases.map((p) => ({
          phraseIndex: p.phraseIndex,
          startMs: p.startMs,
          endMs: p.endMs,
        })),
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(
        errJson?.message || `Lỗi máy chủ AI Alignment (${res.status}).`
      );
    }

    const data = await res.json();
    if (Array.isArray(data?.lines)) {
      for (const line of data.lines) {
        allLrcLines.push({
          timeMs: line.timeMs,
          text: line.text,
          wordTimestamps: Array.isArray(line.words)
            ? line.words.map((w: any) => ({ timeMs: w.timeMs, text: w.text }))
            : undefined,
        });
      }
    }
  }

  if (allLrcLines.length === 0) {
    throw new Error('AI không phát hiện thấy câu hát rõ ràng trong đoạn âm thanh.');
  }

  if (onProgress) {
    onProgress(92, 'Đang đồng bộ word-timestamps với NoteBars & Cao độ thực tế...');
  }

  const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
  const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));

  alignLrcLinesToPhrases(
    clonedPhrases,
    clonedBars,
    allLrcLines,
    rawMonoPcm,
    analysisResult.sampleRate,
    analysisResult.pitchTrack,
    analysisResult.durationMs
  );

  const lowMidi = analysisResult.vocalRange?.lowestMidi ?? 48;
  const highMidi = analysisResult.vocalRange?.highestMidi ?? 76;
  classifyPhraseSectionsAndContours(
    clonedPhrases,
    clonedBars,
    analysisResult.durationMs,
    lowMidi,
    highMidi
  );

  const updated: IVocalAnalysisResult = {
    ...analysisResult,
    phrases: clonedPhrases,
    noteBars: clonedBars,
    lyricSource: 'lrc',
    lyricStatus: 'complete',
  };
  saveLyricsToLocalCache(updated);

  if (onProgress) {
    onProgress(100, 'Hoàn tất tạo & khớp lời chuẩn từng chữ!');
  }

  return updated;
}

/**
 * AI Targeted Gap-Fill: Only sends audio slices for `isMissingLyricGap` phrases (or flagged phrases)
 * to Gemini Audio API and patches those exact phrases without disturbing already-aligned phrases.
 */
export async function transcribeMissingGapsWithAI(params: {
  analysisResult: IVocalAnalysisResult;
  targetPhraseIndices?: number[];
  language?: 'vi' | 'en';
  apiKey?: string;
  onProgress?: (pct: number, status: string) => void;
}): Promise<IVocalAnalysisResult> {
  const { analysisResult, targetPhraseIndices, language = 'vi', apiKey, onProgress } = params;
  const effectiveKey = (apiKey || getSavedGeminiApiKey()).trim();

  const targetPhrases = analysisResult.phrases.filter((p) =>
    targetPhraseIndices && targetPhraseIndices.length > 0
      ? targetPhraseIndices.includes(p.phraseIndex)
      : Boolean(p.isMissingLyricGap || p.alignmentIssue === 'missing_lyric' || p.alignmentIssue === 'empty_audio')
  );

  if (targetPhrases.length === 0) {
    return analysisResult;
  }

  const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
  const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));
  const rawMonoPcm =
    typeof analysisResult.audioBuffer?.getChannelData === 'function'
      ? analysisResult.audioBuffer.getChannelData(0)
      : null;

  for (let idx = 0; idx < targetPhrases.length; idx++) {
    const tp = targetPhrases[idx];
    if (onProgress) {
      onProgress(
        Math.round(((idx + 0.3) / targetPhrases.length) * 90),
        `AI đang vá lời cho câu ${tp.phraseIndex} (${idx + 1}/${targetPhrases.length})...`
      );
    }

    const sliceStart = Math.max(0, tp.startMs - 250);
    const sliceEnd = Math.min(analysisResult.durationMs, tp.endMs + 250);
    const wavBase64 = encodeAudioSliceTo16kWavBase64(
      analysisResult.audioBuffer,
      sliceStart,
      sliceEnd
    );

    const res = await fetch('/api/vocal-studio/align-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveKey ? { 'x-gemini-api-key': effectiveKey } : {}),
      },
      body: JSON.stringify({
        audioBase64: wavBase64,
        mimeType: 'audio/wav',
        language,
        chunkOffsetMs: sliceStart,
        phraseHints: [{ phraseIndex: tp.phraseIndex, startMs: tp.startMs, endMs: tp.endMs }],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Lỗi máy chủ AI Gap-Fill (${res.status}).`);
    }

    const data = await res.json();
    const lines: any[] = Array.isArray(data?.lines) ? data.lines : [];
    const mergedText = lines.map((l) => String(l.text || '').trim()).filter(Boolean).join(' ').trim();
    const mergedWords = lines.flatMap((l) =>
      Array.isArray(l.words)
        ? l.words.map((w: any) => ({ timeMs: Number(w.timeMs), text: String(w.text) }))
        : []
    );

    const targetClone = clonedPhrases.find((p) => p.phraseIndex === tp.phraseIndex);
    if (targetClone && mergedText) {
      targetClone.isMissingLyricGap = false;
      targetClone.isInstrumentalOrVocalize = false;
      targetClone.alignmentIssue = null;
      targetClone.alignmentIssueDetailVi = undefined;
      alignWordsToPhraseNoteBars(
        targetClone,
        clonedBars,
        mergedText,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack,
        mergedWords.length > 0 ? mergedWords : undefined
      );
    }
  }

  const lowMidi = analysisResult.vocalRange?.lowestMidi ?? 48;
  const highMidi = analysisResult.vocalRange?.highestMidi ?? 76;
  classifyPhraseSectionsAndContours(
    clonedPhrases,
    clonedBars,
    analysisResult.durationMs,
    lowMidi,
    highMidi
  );

  const alignmentAudit = auditLyricAlignmentHealth(clonedPhrases, clonedBars);
  const updated: IVocalAnalysisResult = {
    ...analysisResult,
    phrases: clonedPhrases,
    noteBars: clonedBars,
    lyricStatus: alignmentAudit.status === 'healthy' ? 'complete' : 'partial',
    alignmentAudit,
  };
  saveLyricsToLocalCache(updated);
  if (onProgress) onProgress(100, 'Đã vá xong các đoạn thiếu!');
  return updated;
}
