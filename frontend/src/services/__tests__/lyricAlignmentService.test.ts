import { describe, it, expect } from 'vitest';
import {
  parseLrcContent,
  alignLrcLinesToPhrases,
  alignPlainTextToPhrases,
  classifyPhraseSectionsAndContours,
  searchAndTracePhrases,
  mergeWithNextPhrase,
  splitPhraseAtPlayhead,
  updateSinglePhraseLyric,
} from '../lyricAlignmentService';
import type { IVocalPhrase, IVocalNoteBar, IVocalAnalysisResult } from '../vocalFileAnalysisService';

function createMockPhrasesAndBars(): {
  phrases: IVocalPhrase[];
  noteBars: IVocalNoteBar[];
} {
  const noteBars: IVocalNoteBar[] = [
    {
      id: 'nb-1',
      startTimeMs: 1000,
      endTimeMs: 1800,
      durationMs: 800,
      midi: 60,
      exactMidi: 60,
      noteName: 'C4',
      solfegeName: 'Đô 4',
      avgCentsDiff: 0,
      pointsCount: 20,
    },
    {
      id: 'nb-2',
      startTimeMs: 1900,
      endTimeMs: 2800,
      durationMs: 900,
      midi: 64,
      exactMidi: 64,
      noteName: 'E4',
      solfegeName: 'Mi 4',
      avgCentsDiff: 0,
      pointsCount: 20,
    },
    {
      id: 'nb-3',
      startTimeMs: 4000,
      endTimeMs: 5200,
      durationMs: 1200,
      midi: 67,
      exactMidi: 67,
      noteName: 'G4',
      solfegeName: 'Sol 4',
      avgCentsDiff: 0,
      pointsCount: 25,
    },
    {
      id: 'nb-4',
      startTimeMs: 5300,
      endTimeMs: 6800,
      durationMs: 1500,
      midi: 72,
      exactMidi: 72,
      noteName: 'C5',
      solfegeName: 'Đô 5',
      avgCentsDiff: 0,
      pointsCount: 30,
    },
    {
      id: 'nb-5',
      startTimeMs: 8000,
      endTimeMs: 10000,
      durationMs: 2000,
      midi: 60,
      exactMidi: 60,
      noteName: 'C4',
      solfegeName: 'Đô 4',
      avgCentsDiff: 0,
      pointsCount: 35,
    },
  ];

  const phrases: IVocalPhrase[] = [
    {
      id: 'phrase-1',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 2800,
      durationMs: 1800,
      notes: ['C4', 'E4'],
      lowestNote: 'C4',
      highestNote: 'E4',
      avgPitchHz: 293,
      avgMidi: 62,
      pitchJumpSemitones: 4,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 40,
    },
    {
      id: 'phrase-2',
      phraseIndex: 2,
      startMs: 4000,
      endMs: 6800,
      durationMs: 2800,
      notes: ['G4', 'C5'],
      lowestNote: 'G4',
      highestNote: 'C5',
      avgPitchHz: 466,
      avgMidi: 70,
      pitchJumpSemitones: 5,
      difficulty: 'Thử thách',
      difficultyScore: 8,
      pointsCount: 55,
    },
    {
      id: 'phrase-3',
      phraseIndex: 3,
      startMs: 8000,
      endMs: 10000,
      durationMs: 2000,
      notes: ['C4'],
      lowestNote: 'C4',
      highestNote: 'C4',
      avgPitchHz: 261,
      avgMidi: 60,
      pitchJumpSemitones: 0,
      difficulty: 'Dễ',
      difficultyScore: 2,
      pointsCount: 35,
    },
  ];

  return { phrases, noteBars };
}

describe('lyricAlignmentService', () => {
  it('classifies structural sections (Intro, Chorus/Climax, Outro) and aligns plain lyrics to noteBars', () => {
    const { phrases, noteBars } = createMockPhrasesAndBars();
    classifyPhraseSectionsAndContours(phrases, noteBars, 11000, 60, 72);
    alignPlainTextToPhrases(
      phrases,
      noteBars,
      'Chiều nhẹ\nĐỉnh cao trào\nKhép câu'
    );

    expect(phrases[0].sectionType).toBe('intro');
    expect(phrases[1].sectionType).toBe('chorus');
    expect(phrases[2].sectionType).toBe('outro');

    expect(phrases[0].lyricText).toBe('Chiều nhẹ');
    expect(phrases[0].words?.length).toBe(2);
    expect(phrases[0].words?.[0].text).toBe('Chiều');
    expect(phrases[0].words?.[0].noteName).toBe('C4');
    expect(noteBars[0].lyricSyllable).toBe('Chiều');
    expect(noteBars[1].lyricSyllable).toBe('nhẹ');
  });

  it('parses LRC timestamps and aligns them to phrases by maximum temporal overlap', () => {
    const { phrases, noteBars } = createMockPhrasesAndBars();
    const lrc = `[00:01.10] Bước vào câu mở đầu\n[00:04.20] Vút bay lên điệp khúc\n[00:08.15] Lắng đọng kết bài`;
    const parsed = parseLrcContent(lrc);

    expect(parsed.length).toBe(3);
    expect(parsed[0].timeMs).toBe(1100);
    expect(parsed[1].timeMs).toBe(4200);

    alignLrcLinesToPhrases(phrases, noteBars, parsed);
    expect(phrases[0].lyricText).toBe('Bước vào câu mở đầu');
    expect(phrases[1].lyricText).toBe('Vút bay lên điệp khúc');
    expect(phrases[2].lyricText).toBe('Lắng đọng kết bài');
  });

  it('supports accent-insensitive search & trace by lyric, section, phrase index, and timestamp', () => {
    const { phrases, noteBars } = createMockPhrasesAndBars();
    classifyPhraseSectionsAndContours(phrases, noteBars, 11000, 60, 72);
    alignPlainTextToPhrases(
      phrases,
      noteBars,
      'Chiều mưa rơi\nBầu trời rực sáng\nBình yên cuối ngày'
    );

    // Search by unaccented lyric keyword
    const byLyric = searchAndTracePhrases(phrases, 'chieu mua');
    expect(byLyric.map((p) => p.phraseIndex)).toEqual([1]);

    // Search by section name ("diep khuc" / "cao trao")
    const bySection = searchAndTracePhrases(phrases, 'cao trao');
    expect(bySection.map((p) => p.phraseIndex)).toEqual([2]);

    // Search by phrase number ("câu 3")
    const byNumber = searchAndTracePhrases(phrases, 'câu 3');
    expect(byNumber.map((p) => p.phraseIndex)).toEqual([3]);

    // Search by timestamp ("00:05")
    const byTime = searchAndTracePhrases(phrases, '00:05');
    expect(byTime.map((p) => p.phraseIndex)).toEqual([2]);
  });

  it('supports inline lyric update, phrase split, and phrase merge', () => {
    const { phrases, noteBars } = createMockPhrasesAndBars();
    classifyPhraseSectionsAndContours(phrases, noteBars, 11000, 60, 72);
    alignPlainTextToPhrases(phrases, noteBars, 'Câu một\nCâu hai dài hơn\nCâu ba');

    const mockResult: IVocalAnalysisResult = {
      fileName: 'test.wav',
      durationMs: 11000,
      sampleRate: 44100,
      audioBuffer: {} as AudioBuffer,
      audioBlobUrl: '',
      pitchTrack: [],
      noteBars,
      phrases,
      vocalRange: {
        lowestNote: 'C4',
        lowestFreqHz: 261.6,
        lowestMidi: 60,
        highestNote: 'C5',
        highestFreqHz: 523.2,
        highestMidi: 72,
        spanSemitones: 12,
        recommendedVoiceType: 'Tenor',
      },
      estimatedKey: {
        key: 'Đô Trưởng (C Major)',
        root: 'C',
        mode: 'major',
        confidence: 0.9,
        scaleNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      },
      vocalMetrics: {
        singingTimeMs: 6600,
        singingRatioPercent: 60,
        avgClarity: 0.85,
        avgRmsDb: -20,
        densityNotesPerSec: 1.2,
        maxIntervalSemitones: 5,
        overallDifficulty: 'Trung bình',
      },
      practicePlan: {
        title: 'Plan',
        summaryVi: 'Summary',
        recommendedSteps: [],
      },
    };

    const edited = updateSinglePhraseLyric(mockResult, 1, 'Lời mới câu một');
    expect(edited.phrases[0].lyricText).toBe('Lời mới câu một');

    const split = splitPhraseAtPlayhead(edited, 2, 5400);
    expect(split.phrases.length).toBe(4);

    const merged = mergeWithNextPhrase(split, 2);
    expect(merged.phrases.length).toBe(3);
  });
});

