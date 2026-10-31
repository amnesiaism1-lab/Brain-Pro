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
  buildSmartLyricQueries,
  analyzeDeepNoteBarVowelAndTrajectory,
  extractVietnameseWordVowel,
  computeWordIntrinsicDurationWeight,
  alignWordsToPhraseNoteBars,
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
    expect(phrases[0].words?.[1].stepSemitones).toBe(4);
    expect(phrases[0].words?.[1].trajectorySymbol).toBe('↗');
    expect(noteBars[0].lyricSyllable).toBe('Chiều→');
    expect(noteBars[1].lyricSyllable).toBe('nhẹ↗');
  });

  it('extracts smart search queries from complex YouTube/MP3/Stem filenames and analyzes vowel trajectory', () => {
    const queries1 = buildSmartLyricQueries(
      'Thích Thích - Phương Ly ft. JustaTee | Vụ Nổ Lớn - Phát Phát.mp3'
    );
    expect(queries1[0]).toBe('Thích Thích Phương Ly');
    expect(queries1).toContain('Thích Thích');

    const queries2 = buildSmartLyricQueries(
      'Hà Anh Tuấn x Phương Linh - Cơn Mưa Tình Yêu_vocals - Part_1.wav'
    );
    expect(queries2).toContain('Hà Anh Tuấn Phương Linh Cơn Mưa Tình Yêu');
    expect(queries2).toContain('Cơn Mưa Tình Yêu');

    // DAW Project prefix + .vocal.wav multi-dot extension ("Project_12_ANHS_EMS.vocal.wav")
    const queries3 = buildSmartLyricQueries('Project_12_ANHS_EMS.vocal.wav');
    expect(queries3[0]).toBe('ANHS EMS');

    // Conjunction variants ("anhs và ems" -> ["anhs và ems", "anhs ems"])
    const queries4 = buildSmartLyricQueries('anhs và ems');
    expect(queries4).toContain('anhs và ems');
    expect(queries4).toContain('anhs ems');

    const { noteBars } = createMockPhrasesAndBars();
    const mockPitchTrack = [
      { timeMs: 1950, freqHz: 325, midi: 63.7, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.9, volumeDb: -18, isVocal: true },
      { timeMs: 2300, freqHz: 330, midi: 64.0, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.9, volumeDb: -18, isVocal: true },
      { timeMs: 2700, freqHz: 338, midi: 64.4, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.9, volumeDb: -18, isVocal: true },
    ];
    const analysis = analyzeDeepNoteBarVowelAndTrajectory({
      rawMonoPcm: null,
      sampleRate: 44100,
      bar: noteBars[1],
      prevBar: noteBars[0],
      pitchTrack: mockPitchTrack,
    });
    expect(analysis.stepSemitones).toBe(4);
    expect(analysis.pitchTrajectory).toBe('rising');
    expect(analysis.trajectorySymbol).toBe('↗');
    expect(analysis.intraBendCents).toBeGreaterThan(25);
  });

  it('extracts accurate Vietnamese vowels and assigns checked-stop vs melisma notes via DP', () => {
    expect(extractVietnameseWordVowel('Từng')?.vowelPhoneme).toBe('Ư');
    expect(extractVietnameseWordVowel('bước')?.vowelPhoneme).toBe('Ươ');
    expect(extractVietnameseWordVowel('bước')?.isCheckedStop).toBe(true);
    expect(extractVietnameseWordVowel('chân')?.vowelPhoneme).toBe('Â');
    expect(extractVietnameseWordVowel('cuốn')?.vowelPhoneme).toBe('Uô');
    expect(extractVietnameseWordVowel('đi')?.vowelPhoneme).toBe('I');
    expect(extractVietnameseWordVowel('mùa')?.vowelPhoneme).toBe('Ua');

    // Test DP word-to-note alignment: 3 words ("Từng bước mùa") on 4 notes
    // "bước" ends in -c (checked stop), so "mùa" (open phrase-final word) must receive the 2-note melisma!
    const bars: IVocalNoteBar[] = [
      { id: 'b1', startTimeMs: 1000, endTimeMs: 1300, durationMs: 300, midi: 63, exactMidi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'b2', startTimeMs: 1330, endTimeMs: 1600, durationMs: 270, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'b3', startTimeMs: 1640, endTimeMs: 2000, durationMs: 360, midi: 63, exactMidi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', avgCentsDiff: 0, pointsCount: 12 },
      { id: 'b4', startTimeMs: 2020, endTimeMs: 2500, durationMs: 480, midi: 61, exactMidi: 61, noteName: 'C#4', solfegeName: 'Đô# 4', avgCentsDiff: 0, pointsCount: 15 },
    ];
    const phrase: IVocalPhrase = {
      id: 'p1',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 2500,
      durationMs: 1500,
      notes: ['D#4', 'E4', 'C#4'],
      lowestNote: 'C#4',
      highestNote: 'E4',
      avgPitchHz: 311,
      avgMidi: 63,
      pitchJumpSemitones: 2,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 47,
    };

    alignWordsToPhraseNoteBars(phrase, bars, 'Từng bước mùa');
    expect(phrase.words?.length).toBe(3);
    // "Từng" -> b1 (D#4), "bước" -> b2 (E4, single note), "mùa" -> b3..b4 (D#4->C#4 melisma)
    expect(phrase.words?.[0].noteName).toBe('D#4');
    expect(phrase.words?.[0].vowelPhoneme).toBe('Ư');
    expect(phrase.words?.[1].noteName).toBe('E4');
    expect(phrase.words?.[1].vowelPhoneme).toBe('Ươ');
    expect(phrase.words?.[1].endMs).toBe(1600);
    expect(phrase.words?.[2].noteName).toBe('D#4');
    expect(phrase.words?.[2].endNoteName).toBe('C#4');
    expect(phrase.words?.[2].noteSequence).toEqual(['D#4', 'C#4']);
    expect(phrase.words?.[2].glideSemitones).toBe(-2);
    expect(phrase.words?.[2].isSustained).toBe(true);
    expect(phrase.words?.[2].vowelPhoneme).toBe('Ua');
    expect(phrase.words?.[2].startMs).toBe(1640);
    expect(phrase.words?.[2].endMs).toBe(2500);
  });

  it('splits same-pitch multi-syllable bars at consonant dips while preserving sustained notes and low-to-high glides', () => {
    // 3 words ("Từng bước yêu") where:
    // - Bar 1 (1000..1500ms, D#4) contains 2 articulated syllables ("Từng bước") with a bridged consonant dip at 1250ms
    // - Bar 2 (1560..1850ms, C4) and Bar 3 (1865..2650ms, E4) are a continuous legato low-to-high glide on "yêu" (held long)
    const bars: IVocalNoteBar[] = [
      { id: 'sb-1', startTimeMs: 1000, endTimeMs: 1500, durationMs: 500, midi: 63, exactMidi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', avgCentsDiff: 0, pointsCount: 16 },
      { id: 'sb-2', startTimeMs: 1560, endTimeMs: 1850, durationMs: 290, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'sb-3', startTimeMs: 1865, endTimeMs: 2650, durationMs: 785, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 24 },
    ];
    const pitchTrack = [
      { timeMs: 1050, freqHz: 311, midi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.92, volumeDb: -16, isVocal: true },
      { timeMs: 1150, freqHz: 311, midi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.90, volumeDb: -17, isVocal: true },
      { timeMs: 1250, freqHz: 311, midi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.65, volumeDb: -25, isVocal: true }, // Bridged consonant dip!
      { timeMs: 1350, freqHz: 311, midi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.91, volumeDb: -15, isVocal: true },
      { timeMs: 1450, freqHz: 311, midi: 63, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.89, volumeDb: -16, isVocal: true },
      // Continuous legato transition between sb-2 (C4) and sb-3 (E4)
      { timeMs: 1840, freqHz: 261.6, midi: 60, noteName: 'C4', solfegeName: 'Đô 4', clarity: 0.92, volumeDb: -15, isVocal: true },
      { timeMs: 1860, freqHz: 293.6, midi: 62, noteName: 'D4', solfegeName: 'Rê 4', clarity: 0.90, volumeDb: -15, isVocal: true },
      { timeMs: 1880, freqHz: 329.6, midi: 64, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.93, volumeDb: -14, isVocal: true },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-glide',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 2650,
      durationMs: 1650,
      notes: ['D#4', 'C4', 'E4'],
      lowestNote: 'C4',
      highestNote: 'E4',
      avgPitchHz: 311,
      avgMidi: 63,
      pitchJumpSemitones: 4,
      difficulty: 'Trung bình',
      difficultyScore: 5,
      pointsCount: 50,
    };

    alignWordsToPhraseNoteBars(phrase, bars, 'Từng bước yêu', null, 44100, pitchTrack);
    expect(phrase.words?.length).toBe(3);
    // Word 0 ("Từng") and Word 1 ("bước") each get half of the split D#4 bar
    expect(phrase.words?.[0].noteName).toBe('D#4');
    expect(phrase.words?.[1].noteName).toBe('D#4');
    // Word 2 ("yêu") gets the low-to-high C4 -> E4 glide and is marked as sustained!
    expect(phrase.words?.[2].noteName).toBe('C4');
    expect(phrase.words?.[2].endNoteName).toBe('E4');
    expect(phrase.words?.[2].noteSequence).toEqual(['C4', 'E4']);
    expect(phrase.words?.[2].glideSemitones).toBe(4);
    expect(phrase.words?.[2].trajectorySymbol).toBe('⤴');
    expect(phrase.words?.[2].isSustained).toBe(true);
  });

  it('parses LRC timestamps and re-segments fragmented phrases cleanly without gluing lines together', () => {
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

    const byLyric = searchAndTracePhrases(phrases, 'chieu mua');
    expect(byLyric.map((p) => p.phraseIndex)).toEqual([1]);

    const bySection = searchAndTracePhrases(phrases, 'cao trao');
    expect(bySection.map((p) => p.phraseIndex)).toEqual([2]);

    const byNumber = searchAndTracePhrases(phrases, 'câu 3');
    expect(byNumber.map((p) => p.phraseIndex)).toEqual([3]);

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

  it('parses Enhanced LRC <mm:ss.xx> word timestamps, weights intrinsic phonetic duration, and splits merged 1-semitone pitch steps', () => {
    // 1. Intrinsic phonetic duration weights
    expect(computeWordIntrinsicDurationWeight('bước', false)).toBeLessThan(0.7);
    expect(computeWordIntrinsicDurationWeight('mùa', true)).toBeGreaterThan(1.5);

    // 2. Enhanced Karaoke LRC inline word timestamps
    const enhancedLrc = `[00:01.00]<00:01.05>Từng <00:01.35>bước <00:01.70>yêu`;
    const parsed = parseLrcContent(enhancedLrc);
    expect(parsed.length).toBe(1);
    expect(parsed[0].text).toBe('Từng bước yêu');
    expect(parsed[0].wordTimestamps?.length).toBe(3);
    expect(parsed[0].wordTimestamps?.[0]).toEqual({ timeMs: 1050, text: 'Từng' });
    expect(parsed[0].wordTimestamps?.[2]).toEqual({ timeMs: 1700, text: 'yêu' });

    // 3. Stepwise 1-semitone pitch inflection split (63.15 D#4 -> 63.88 E4 merged into 1 bar)
    const bars: IVocalNoteBar[] = [
      {
        id: 'step-bar',
        startTimeMs: 1000,
        endTimeMs: 1700,
        durationMs: 700,
        midi: 63,
        exactMidi: 63.5,
        noteName: 'D#4',
        solfegeName: 'Rê# 4',
        avgCentsDiff: 0,
        pointsCount: 14,
      },
    ];
    const pitchTrack = [
      { timeMs: 1080, freqHz: 314, midi: 63.15, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.91, volumeDb: -16, isVocal: true },
      { timeMs: 1200, freqHz: 314, midi: 63.18, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.90, volumeDb: -16, isVocal: true },
      { timeMs: 1340, freqHz: 315, midi: 63.20, noteName: 'D#4', solfegeName: 'Rê# 4', clarity: 0.86, volumeDb: -18, isVocal: true },
      { timeMs: 1480, freqHz: 327, midi: 63.86, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.92, volumeDb: -15, isVocal: true },
      { timeMs: 1620, freqHz: 328, midi: 63.90, noteName: 'E4', solfegeName: 'Mi 4', clarity: 0.92, volumeDb: -15, isVocal: true },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-step',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 1700,
      durationMs: 700,
      notes: ['D#4'],
      lowestNote: 'D#4',
      highestNote: 'D#4',
      avgPitchHz: 318,
      avgMidi: 63.5,
      pitchJumpSemitones: 1,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 14,
    };

    alignWordsToPhraseNoteBars(phrase, bars, 'Từng bước', null, 44100, pitchTrack);
    expect(phrase.words?.length).toBe(2);
    expect(phrase.words?.[0].noteName).toBe('D#4');
    expect(phrase.words?.[1].noteName).toBe('E4');
  });
});
