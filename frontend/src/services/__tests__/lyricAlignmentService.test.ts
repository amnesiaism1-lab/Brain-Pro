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
  decomposeVietnameseWordPhoneticStates,
  computeOralToNasalRatioDbAtMs,
  classifyDuetSingerVoices,
  adjustAdjacentNoteBarBoundary,
  splitNoteBarOnCanvas,
  mergeAdjacentNoteBarsOnCanvas,
  alignWordsToPhraseNoteBars,
  fetchAutoLyricsFromLrclib,
  estimateOptimalLrcOffsetMs,
  nudgeLyricOffset,
  searchSongLyricCandidates,
  realignLyricsToAnalysisResult,
  auditLyricAlignmentHealth,
  ILrcLine,
} from '../lyricAlignmentService';
import {
  vocalFileAnalysisService,
  IVocalPhrase,
  IVocalNoteBar,
  IVocalAnalysisResult,
} from '../vocalFileAnalysisService';

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

  it('implements Next-Frontier Capabilities: Phonetic States, Nasal Murmur Ratio, Interactive Canvas Handles, and Duet Singer Diarization', () => {
    // 1. Capability 1: Phonetic state decomposition
    expect(decomposeVietnameseWordPhoneticStates('bước')).toEqual({
      onsetState: 'STOP_FRIC',
      nucleusState: 'V_O_UNROUND',
      codaState: 'STOP_FRIC',
    });
    expect(decomposeVietnameseWordPhoneticStates('mình')).toEqual({
      onsetState: 'NASAL_LIQUID',
      nucleusState: 'V_I',
      codaState: 'NASAL_LIQUID',
    });
    expect(decomposeVietnameseWordPhoneticStates('em')).toEqual({
      onsetState: 'NONE',
      nucleusState: 'V_E',
      codaState: 'NASAL_LIQUID',
    });

    // 2. Capability 2: Sub-Band Oral-to-Nasal Energy Ratio (E_600..2400Hz / E_200..360Hz)
    const sr = 16000;
    const pcm = new Float32Array(sr); // 1.0s buffer
    // 0.0..0.35s: Vowel with strong oral formant (1120Hz) + fundamental (285Hz)
    // 0.35..0.65s: Nasal murmur consonant ("m/n") with only low 285Hz murmur and suppressed oral formants
    // 0.65..1.0s: Vowel with strong oral formant (1600Hz) + fundamental (285Hz)
    for (let n = 0; n < pcm.length; n++) {
      const t = n / sr;
      const f0Wave = 0.4 * Math.sin(2 * Math.PI * 285 * t);
      if (t < 0.35) {
        pcm[n] = f0Wave + 0.45 * Math.sin(2 * Math.PI * 1120 * t);
      } else if (t < 0.65) {
        pcm[n] = f0Wave + 0.02 * Math.sin(2 * Math.PI * 1120 * t);
      } else {
        pcm[n] = f0Wave + 0.45 * Math.sin(2 * Math.PI * 1600 * t);
      }
    }
    const vowelRatioDb = computeOralToNasalRatioDbAtMs(pcm, sr, 200);
    const nasalRatioDb = computeOralToNasalRatioDbAtMs(pcm, sr, 500);
    expect(vowelRatioDb - nasalRatioDb).toBeGreaterThan(6.0);

    // 3. Capability 3: Interactive Canvas Word-Edge Drag, Split & Merge
    const { phrases, noteBars } = createMockPhrasesAndBars();
    alignPlainTextToPhrases(phrases, noteBars, 'Chiều nhẹ\nĐỉnh cao trào\nKhép câu');
    const mockResult: IVocalAnalysisResult = {
      fileName: 'Hà Anh Tuấn x Phương Linh - Cơn Mưa Tình Yêu.wav',
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
        recommendedVoiceType: 'Duet',
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

    const dragged = adjustAdjacentNoteBarBoundary(mockResult, 'nb-1', 'nb-2', 2050);
    expect(dragged.noteBars[0].endTimeMs).toBe(2046);
    expect(dragged.noteBars[1].startTimeMs).toBe(2054);
    expect(dragged.phrases[0].words?.[0].endMs).toBe(2046);
    expect(dragged.phrases[0].words?.[1].startMs).toBe(2054);

    const initialCount = dragged.noteBars.length;
    const splitCanvas = splitNoteBarOnCanvas(dragged, 'nb-1', 1400);
    expect(splitCanvas.noteBars.length).toBe(initialCount + 1);

    const mergedCanvas = mergeAdjacentNoteBarsOnCanvas(splitCanvas, 'nb-1-a', 'nb-1-b');
    expect(mergedCanvas.noteBars.length).toBe(initialCount);
    expect(mergedCanvas.noteBars[0].startTimeMs).toBe(1000);
    expect(mergedCanvas.noteBars[0].endTimeMs).toBe(2046);

    // 4. Capability 4: Duet Singer Diarization (Giọng A Nam/Trầm vs Giọng B Nữ/Cao)
    classifyDuetSingerVoices(
      mockResult.phrases,
      mockResult.noteBars,
      mockResult.pitchTrack,
      mockResult.fileName
    );
    expect(mockResult.phrases[0].singerId).toBe('voice_a');
    expect(mockResult.phrases[1].singerId).toBe('voice_b');
    expect(mockResult.phrases[2].singerId).toBe('voice_a');
  });

  it('deterministically resolves synced LRC for ANHS EMS and Cơn Mưa Tình Yêu and prevents full-beat intro lyric shifting', async () => {
    // 1. Conjunction-free query ("anhs ems") is prioritized BEFORE "anhs và ems" to avoid LRCLIB SQLite FTS5 HTTP 503
    const queries = buildSmartLyricQueries('anhs và ems.mp3');
    expect(queries[0]).toBe('anhs ems');
    expect(queries).toContain('anhs và ems');

    // YouTube MV filenames with "[feat. X]" or "(feat. X)" must not leave dangling "[" or "(" (LRCLIB 503 trigger)
    const mvQueries = buildSmartLyricQueries('Wxrdie - CẦN GÌ NÓI IU [feat. 2pillz] - OFFICIAL MV.mp3');
    expect(mvQueries[0]).toBe('Wxrdie CẦN GÌ NÓI IU');
    expect(mvQueries.every((q) => !/[()[\]]/.test(q))).toBe(true);

    // 2. Deterministic synced LRC resolution for all tracks regardless of filename variation
    const resAnhs = await fetchAutoLyricsFromLrclib('anhs và ems.mp3', 265000);
    expect(resAnhs?.syncedLyrics).toContain('[00:15.89]Anh là người đàn ông may mắn');

    const resCanGiNoiIu = await fetchAutoLyricsFromLrclib(
      'Wxrdie - CẦN GÌ NÓI IU [feat. 2pillz] - OFFICIAL MV.mp3',
      160000
    );
    expect(resCanGiNoiIu?.syncedLyrics).toContain('[00:08.50]Đồ này khá trôi, em cũng khá say');
    expect(resCanGiNoiIu?.syncedLyrics).toContain('Bởi vì all I want for christmas is you');

    const resConMua = await fetchAutoLyricsFromLrclib(
      'Hà Anh Tuấn x Phương Linh - Cơn Mưa Tình Yêu (Full Beat).mp3',
      296000
    );
    expect(resConMua?.syncedLyrics).toContain('[00:34.14]Người yêu ơi cỏ mềm đã héo khô');

    // 3. Full-beat track with 34s instrumental intro (beat noteBars at 1.2s..20s)
    // must NOT shift [00:34.14] onto 00:01.20!
    const lrcLines = parseLrcContent(resConMua!.syncedLyrics!);
    const beatAndVocalBars: IVocalNoteBar[] = [
      // Instrumental intro beat bars (00:01.20 .. 00:12.00)
      { id: 'intro-1', startTimeMs: 1200, endTimeMs: 2500, durationMs: 1300, midi: 55, exactMidi: 55, noteName: 'G3', solfegeName: 'Sol 3', avgCentsDiff: 0, pointsCount: 20 },
      { id: 'intro-2', startTimeMs: 5000, endTimeMs: 6500, durationMs: 1500, midi: 57, exactMidi: 57, noteName: 'A3', solfegeName: 'La 3', avgCentsDiff: 0, pointsCount: 20 },
      // Real first vocal phrase at 34.14s ("Người yêu ơi cỏ mềm đã héo khô")
      { id: 'voc-1', startTimeMs: 34150, endTimeMs: 35200, durationMs: 1050, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 25 },
      { id: 'voc-2', startTimeMs: 35300, endTimeMs: 37500, durationMs: 2200, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Rê 4', avgCentsDiff: 0, pointsCount: 35 },
    ];
    const rawPhrases: IVocalPhrase[] = [
      {
        id: 'raw-1',
        phraseIndex: 1,
        startMs: 1200,
        endMs: 6500,
        durationMs: 5300,
        notes: ['G3', 'A3'],
        lowestNote: 'G3',
        highestNote: 'A3',
        avgPitchHz: 200,
        avgMidi: 56,
        pitchJumpSemitones: 2,
        difficulty: 'Dễ',
        difficultyScore: 2,
        pointsCount: 40,
      },
      {
        id: 'raw-2',
        phraseIndex: 2,
        startMs: 34150,
        endMs: 37500,
        durationMs: 3350,
        notes: ['C4', 'D4'],
        lowestNote: 'C4',
        highestNote: 'D4',
        avgPitchHz: 277,
        avgMidi: 61,
        pitchJumpSemitones: 2,
        difficulty: 'Dễ',
        difficultyScore: 2,
        pointsCount: 60,
      },
    ];

    const offsetMs = estimateOptimalLrcOffsetMs(rawPhrases, beatAndVocalBars, lrcLines, 296000);
    expect(Math.abs(offsetMs)).toBeLessThanOrEqual(800);

    alignLrcLinesToPhrases(rawPhrases, beatAndVocalBars, lrcLines, null, 44100, [], 296000);
    // Phrase 1 must be "Người yêu ơi cỏ mềm đã héo khô" at ~34.15s, NOT shifted onto 1.2s!
    expect(rawPhrases[0].lyricText).toBe('Người yêu ơi cỏ mềm đã héo khô');
    expect(rawPhrases[0].startMs).toBeGreaterThanOrEqual(33500);
  });

  it('correctly aligns LRC and plain text with 24s leading silence and bridges intro gaps', () => {
    // Audio with 24s leading silence where LRC was created for 4.5s album intro
    const vocalBars: IVocalNoteBar[] = [
      { id: 'b-1', startTimeMs: 24000, endTimeMs: 25500, durationMs: 1500, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 30 },
      { id: 'b-2', startTimeMs: 26000, endTimeMs: 27800, durationMs: 1800, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Rê 4', avgCentsDiff: 0, pointsCount: 35 },
      { id: 'b-3', startTimeMs: 28500, endTimeMs: 31000, durationMs: 2500, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 45 },
    ];
    const phrases: IVocalPhrase[] = [
      {
        id: 'p-1',
        phraseIndex: 1,
        startMs: 24000,
        endMs: 27800,
        durationMs: 3800,
        notes: ['C4', 'D4'],
        lowestNote: 'C4',
        highestNote: 'D4',
        avgPitchHz: 261,
        avgMidi: 61,
        pitchJumpSemitones: 2,
        difficulty: 'Dễ',
        difficultyScore: 3,
        pointsCount: 65,
      },
      {
        id: 'p-2',
        phraseIndex: 2,
        startMs: 28500,
        endMs: 31000,
        durationMs: 2500,
        notes: ['E4'],
        lowestNote: 'E4',
        highestNote: 'E4',
        avgPitchHz: 330,
        avgMidi: 64,
        pitchJumpSemitones: 0,
        difficulty: 'Dễ',
        difficultyScore: 2,
        pointsCount: 45,
      },
    ];

    const lrcLines: ILrcLine[] = [
      { timeMs: 4500, text: 'Giữa trời mênh mang đi' },
      { timeMs: 9000, text: 'Em đi tìm anh' },
    ];

    // Offset should bridge the ~19.5s gap between 4.5s LRC and 24.0s vocal onset!
    const offsetMs = estimateOptimalLrcOffsetMs(phrases, vocalBars, lrcLines, 43000);
    expect(offsetMs).toBeGreaterThanOrEqual(18500);
    expect(offsetMs).toBeLessThanOrEqual(20500);

    alignLrcLinesToPhrases(phrases, vocalBars, lrcLines, null, 44100, [], 43000);
    expect(phrases[0].lyricText).toBe('Giữa trời mênh mang đi');
    expect(phrases[0].startMs).toBe(24000);
    expect(phrases[1].lyricText).toBe('Em đi tìm anh');
    expect(phrases[1].startMs).toBe(28500);
  });

  it('correctly trims leading silence and shifts audio, notes, and phrases by trimMs', () => {
    const { phrases, noteBars } = createMockPhrasesAndBars();
    // Shift mock bars and phrases to start at 24000ms
    const shiftedBars = noteBars.map((b) => ({
      ...b,
      startTimeMs: b.startTimeMs + 23000,
      endTimeMs: b.endTimeMs + 23000,
    }));
    const shiftedPhrases = phrases.map((p) => ({
      ...p,
      startMs: p.startMs + 23000,
      endMs: p.endMs + 23000,
    }));

    const mockResult: IVocalAnalysisResult = {
      fileName: 'giữa trời mang đi vocal.wav',
      durationMs: 43000,
      sampleRate: 44100,
      audioBuffer: {
        numberOfChannels: 1,
        length: 44100 * 43,
        sampleRate: 44100,
        duration: 43,
        getChannelData: () => new Float32Array(44100 * 43),
      } as unknown as AudioBuffer,
      audioBlobUrl: 'blob:test',
      pitchTrack: [
        { timeMs: 24000, freqHz: 261, midi: 60, noteName: 'C4', solfegeName: 'Đô 4', clarity: 0.9, volumeDb: -15, isVocal: true },
        { timeMs: 25000, freqHz: 293, midi: 62, noteName: 'D4', solfegeName: 'Rê 4', clarity: 0.9, volumeDb: -15, isVocal: true },
      ],
      noteBars: shiftedBars,
      phrases: shiftedPhrases,
      leadingSilenceMs: 24000,
      firstVocalOnsetMs: 24000,
      hasLeadingSilence: true,
      vocalRange: {
        lowestNote: 'C4',
        lowestFreqHz: 261,
        lowestMidi: 60,
        highestNote: 'G4',
        highestFreqHz: 392,
        highestMidi: 67,
        spanSemitones: 7,
        recommendedVoiceType: 'Tenor',
      },
      estimatedKey: { key: 'C Major', root: 'C', mode: 'major', confidence: 0.9, scaleNotes: [] },
      vocalMetrics: {
        singingTimeMs: 15000,
        singingRatioPercent: 35,
        avgClarity: 0.85,
        avgRmsDb: -15,
        densityNotesPerSec: 1.2,
        maxIntervalSemitones: 3,
        overallDifficulty: 'Dễ',
      },
      practicePlan: { title: 'P', summaryVi: 'S', recommendedSteps: [] },
    };

    // Trim 23200ms of leading silence (leaving 800ms natural breath lead-in)
    const trimmed = vocalFileAnalysisService.trimLeadingSilence(mockResult, 23200);
    expect(trimmed.durationMs).toBe(43000 - 23200);
    expect(trimmed.noteBars[0].startTimeMs).toBe(24000 - 23200); // 800ms
    expect(trimmed.phrases[0].startMs).toBe(24000 - 23200); // 800ms
    expect(trimmed.pitchTrack[0].timeMs).toBe(24000 - 23200); // 800ms
    expect(trimmed.hasLeadingSilence).toBe(false);

    // Test nudgeLyricOffset
    const nudged = nudgeLyricOffset(trimmed, 200);
    expect(nudged.phrases[0].startMs).toBe(1000);
  });

  it('discovers multi-candidate songs, handles alias queries for "giữa trời mang đi", and re-aligns lyrics without reloading audio', async () => {
    // 1. Alias query generation for colloquial filename "giữa trời mang đi vocal.wav"
    const queries = buildSmartLyricQueries('giữa trời mang đi vocal.wav');
    expect(queries).toContain('Trời Giấu Trời Mang Đi');
    expect(queries).toContain('Giữa Đại Lộ Đông Tây Uyên Linh');

    // 2. Candidate discovery: returns ranked candidates including "Trời Giấu Trời Mang Đi" with high confidence
    const candidates = await searchSongLyricCandidates('giữa trời mang đi vocal.wav', 507000);
    expect(candidates.length).toBeGreaterThan(0);
    const troiGiauCand = candidates.find((c) => c.trackName.includes('Trời Giấu Trời Mang Đi'));
    expect(troiGiauCand).toBeDefined();
    expect(troiGiauCand?.hasSyncedLyrics).toBe(true);
    expect(troiGiauCand?.confidencePct).toBeGreaterThanOrEqual(75);

    // 3. Candidate search with custom query "Nàng Thơ"
    const nangThoCandidates = await searchSongLyricCandidates('giữa trời mang đi vocal.wav', 507000, 'Nàng Thơ');
    const nangThoCand = nangThoCandidates.find((c) => c.trackName.includes('Nàng Thơ'));
    expect(nangThoCand).toBeDefined();
    expect(nangThoCand?.syncedLyrics).toContain('Em, ngày em đánh rơi nụ cười vào anh');

    // 4. Realign lyrics to analysis result without reloading audio
    const sampleRate = 44100;
    const mockAudioBuffer = {
      sampleRate,
      length: sampleRate * 120,
      numberOfChannels: 1,
      duration: 120,
      getChannelData: () => new Float32Array(sampleRate * 120),
    } as unknown as AudioBuffer;

    const baseResult: IVocalAnalysisResult = {
      fileName: 'giữa trời mang đi vocal.wav',
      durationMs: 120000,
      sampleRate,
      audioBuffer: mockAudioBuffer,
      audioBlobUrl: 'blob:test',
      pitchTrack: [
        { timeMs: 15500, freqHz: 261, midi: 60, noteName: 'C4', solfegeName: 'Đô 4', clarity: 0.9, volumeDb: -15, isVocal: true },
        { timeMs: 17000, freqHz: 293, midi: 62, noteName: 'D4', solfegeName: 'Rê 4', clarity: 0.9, volumeDb: -15, isVocal: true },
      ],
      noteBars: [
        { id: 'b1', startTimeMs: 15500, endTimeMs: 16800, durationMs: 1300, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 20 },
        { id: 'b2', startTimeMs: 17000, endTimeMs: 19500, durationMs: 2500, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Rê 4', avgCentsDiff: 0, pointsCount: 30 },
      ],
      phrases: [
        {
          id: 'p1',
          phraseIndex: 1,
          startMs: 15500,
          endMs: 19500,
          durationMs: 4000,
          notes: ['C4', 'D4'],
          lowestNote: 'C4',
          highestNote: 'D4',
          avgPitchHz: 275,
          avgMidi: 61,
          pitchJumpSemitones: 2,
          difficulty: 'Dễ',
          difficultyScore: 2,
          solfegeText: 'Đô4 Rê4',
          lyricText: 'Vô tư cho đi hết những ngày thơ',
        },
      ],
      vocalRange: {
        lowestNote: 'C4',
        lowestFreqHz: 261,
        lowestMidi: 60,
        highestNote: 'G4',
        highestFreqHz: 392,
        highestMidi: 67,
        spanSemitones: 7,
        recommendedVoiceType: 'Tenor',
      },
      estimatedKey: { key: 'C Major', root: 'C', mode: 'major', confidence: 0.9, scaleNotes: [] },
      vocalMetrics: {
        singingTimeMs: 4000,
        singingRatioPercent: 30,
        avgClarity: 0.85,
        avgRmsDb: -15,
        densityNotesPerSec: 1,
        maxIntervalSemitones: 2,
        overallDifficulty: 'Dễ',
      },
      practicePlan: { title: 'P', summaryVi: 'S', recommendedSteps: [] },
    };

    // Realign with Trời Giấu Trời Mang Đi
    const realigned = realignLyricsToAnalysisResult(
      baseResult,
      troiGiauCand!.syncedLyrics!,
      true,
      'Trời Giấu Trời Mang Đi – AMEE & ViruSs'
    );

    expect(realigned.matchedTrackTitle).toBe('Trời Giấu Trời Mang Đi – AMEE & ViruSs');
    expect(realigned.phrases[0].lyricText).toContain('Sương mờ che khuất đồi');
    expect(realigned.deepVerification?.toneHarmonyScorePct).toBeGreaterThanOrEqual(0);
    expect(realigned.deepVerification?.analysisMode).toBe('deep_verification');
  }, 20000);

  it('assigns distinct per-word MIDI from pitchTrack when W > B instead of duplicating parent bar MIDI', () => {
    const phrase: IVocalPhrase = {
      id: 'p-rapid',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 1900,
      durationMs: 900,
      notes: ['C4', 'D4', 'E4'],
      lowestNote: 'C4',
      highestNote: 'E4',
      avgPitchHz: 293,
      avgMidi: 62,
      pitchJumpSemitones: 4,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 45,
    };

    // Single long NoteBar spanning 1000..1900ms with parent nominal midi 62 (D4)
    const bars: IVocalNoteBar[] = [
      {
        id: 'bar-rapid',
        startTimeMs: 1000,
        endTimeMs: 1900,
        durationMs: 900,
        midi: 62,
        exactMidi: 62,
        noteName: 'D4',
        solfegeName: 'Rê 4',
        avgCentsDiff: 0,
        pointsCount: 45,
      },
    ];

    // PitchTrack smoothly stepping from C4 (60) -> D4 (62) -> E4 (64)
    const pitchTrack = [];
    for (let t = 1000; t <= 1900; t += 20) {
      const midi = t < 1300 ? 60 : t < 1600 ? 62 : 64;
      const noteName = midi === 60 ? 'C4' : midi === 62 ? 'D4' : 'E4';
      const solfegeName = midi === 60 ? 'Đô 4' : midi === 62 ? 'Rê 4' : 'Mi 4';
      pitchTrack.push({
        timeMs: t,
        freqHz: 440 * Math.pow(2, (midi - 69) / 12),
        midi,
        noteName,
        solfegeName,
        clarity: 0.92,
        volumeDb: -12,
        isVocal: true,
      });
    }

    alignWordsToPhraseNoteBars(phrase, bars, 'em đi về', null, 44100, pitchTrack, undefined, true);
    expect(phrase.words?.length).toBe(3);
    expect(phrase.words?.[0].midi).toBe(60);
    expect(phrase.words?.[1].midi).toBe(62);
    expect(phrase.words?.[2].midi).toBe(64);
  });

  it('distinguishes steady vowel sustain core from clipped checked-stop with decaying tail', () => {
    const phrase: IVocalPhrase = {
      id: 'p-sustain',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 2800,
      durationMs: 1800,
      notes: ['C4', 'G4'],
      lowestNote: 'C4',
      highestNote: 'G4',
      avgPitchHz: 330,
      avgMidi: 64,
      pitchJumpSemitones: 7,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 50,
    };

    const bars: IVocalNoteBar[] = [
      {
        id: 'nb-stop',
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
        id: 'nb-open',
        startTimeMs: 1850,
        endTimeMs: 2800,
        durationMs: 950,
        midi: 67,
        exactMidi: 67,
        noteName: 'G4',
        solfegeName: 'Sol 4',
        avgCentsDiff: 0,
        pointsCount: 30,
      },
    ];

    const pitchTrack = [];
    // First word "bước" (checked-stop): loud 200ms then quiet decaying reverb tail (-32dB)
    for (let t = 1000; t <= 1800; t += 25) {
      pitchTrack.push({
        timeMs: t,
        freqHz: 261.6,
        midi: 60,
        noteName: 'C4',
        solfegeName: 'Đô 4',
        clarity: 0.9,
        volumeDb: t <= 1220 ? -10 : -32,
        isVocal: true,
      });
    }
    // Second word "ơi" (open vowel): steady loud sustain for 950ms
    for (let t = 1850; t <= 2800; t += 25) {
      pitchTrack.push({
        timeMs: t,
        freqHz: 392.0,
        midi: 67,
        noteName: 'G4',
        solfegeName: 'Sol 4',
        clarity: 0.95,
        volumeDb: -10,
        isVocal: true,
      });
    }

    alignWordsToPhraseNoteBars(phrase, bars, 'bước ơi', null, 44100, pitchTrack, undefined, true);
    expect(phrase.words?.length).toBe(2);
    expect(phrase.words?.[0].isSustained).toBeFalsy();
    expect(phrase.words?.[0].sustainKind).toBe('clipped');
    expect(phrase.words?.[1].isSustained).toBe(true);
    expect(phrase.words?.[1].sustainCoreMs).toBeGreaterThanOrEqual(750);
  });

  it('handles progressive tempo drift across song using piecewise DTW alignment', () => {
    // 4 phrases drifting progressively later compared to LRC timestamps:
    // LRC: 1000, 10000, 20000, 30000
    // Actual audio: 1000 (+0), 10600 (+600ms), 21400 (+1400ms), 32200 (+2200ms)
    const actualStarts = [1000, 10600, 21400, 32200];
    const bars: IVocalNoteBar[] = actualStarts.map((s, i) => ({
      id: `nb-dtw-${i}`,
      startTimeMs: s,
      endTimeMs: s + 1500,
      durationMs: 1500,
      midi: 60 + i * 2,
      exactMidi: 60 + i * 2,
      noteName: 'C4',
      solfegeName: 'Đô 4',
      avgCentsDiff: 0,
      pointsCount: 20,
    }));
    const phrases: IVocalPhrase[] = actualStarts.map((s, i) => ({
      id: `p-dtw-${i}`,
      phraseIndex: i + 1,
      startMs: s,
      endMs: s + 1500,
      durationMs: 1500,
      notes: ['C4'],
      lowestNote: 'C4',
      highestNote: 'C4',
      avgPitchHz: 261,
      avgMidi: 60 + i * 2,
      pitchJumpSemitones: 0,
      difficulty: 'Dễ',
      difficultyScore: 2,
      pointsCount: 20,
    }));

    const lrcLines: ILrcLine[] = [
      { timeMs: 1000, text: 'Câu một đầu bài' },
      { timeMs: 10000, text: 'Câu hai giữa bài' },
      { timeMs: 20000, text: 'Câu ba trôi nhịp' },
      { timeMs: 30000, text: 'Câu bốn cuối bài' },
    ];

    alignLrcLinesToPhrases(phrases, bars, lrcLines, null, 44100, [], 35000);
    expect(phrases.length).toBe(4);
    expect(phrases[2].startMs).toBeGreaterThanOrEqual(21000);
    expect(phrases[3].startMs).toBeGreaterThanOrEqual(31800);
    expect(phrases[3].lyricText).toBe('Câu bốn cuối bài');
  });

  it('rebuilds phrases accurately with piecewise drift correction when phrase count differs from LRC lines', () => {
    const actualStarts = [1000, 10700, 21500, 32300];
    const bars: IVocalNoteBar[] = actualStarts.map((s, i) => ({
      id: `nb-dtw-r-${i}`,
      startTimeMs: s,
      endTimeMs: s + 1400,
      durationMs: 1400,
      midi: 60 + i * 2,
      exactMidi: 60 + i * 2,
      noteName: 'C4',
      solfegeName: 'Đô 4',
      avgCentsDiff: 0,
      pointsCount: 20,
    }));
    // Extra fragmented phrase so phrases.length (5) !== lrcLines.length (4)
    const phrases: IVocalPhrase[] = [...actualStarts, 34000].map((s, i) => ({
      id: `p-dtw-r-${i}`,
      phraseIndex: i + 1,
      startMs: s,
      endMs: s + 1200,
      durationMs: 1200,
      notes: ['C4'],
      lowestNote: 'C4',
      highestNote: 'C4',
      avgPitchHz: 261,
      avgMidi: 60,
      pitchJumpSemitones: 0,
      difficulty: 'Dễ',
      difficultyScore: 2,
      pointsCount: 15,
    }));

    const lrcLines: ILrcLine[] = [
      { timeMs: 1000, text: 'Câu một chuẩn' },
      { timeMs: 10000, text: 'Câu hai trôi bảy trăm' },
      { timeMs: 20000, text: 'Câu ba trôi một ngàn năm' },
      { timeMs: 30000, text: 'Câu bốn trôi hai ngàn ba' },
    ];

    alignLrcLinesToPhrases(phrases, bars, lrcLines, null, 44100, [], 36000);
    expect(phrases.length).toBe(4);
    expect(phrases[2].startMs).toBe(21500);
    expect(phrases[3].startMs).toBe(32300);
    expect(phrases[3].lyricText).toBe('Câu bốn trôi hai ngàn ba');
  });

  it('sanitizes LRC metadata, instrumental markers, and applies [offset:] tag', () => {
    const rawLrc = [
      '[ti:Test Song]',
      '[ar:Test Artist]',
      '[offset:500]',
      '[00:02.00]Nhạc dạo...',
      '[00:04.00][Chorus]',
      '[00:06.00]~~~ ♪♪♪ ~~~',
      '[00:10.00]Câu hát thật đầu tiên',
      '[00:15.00]Instrumental',
      '[00:20.00]Câu hát thật thứ hai',
    ].join('\n');

    const lines = parseLrcContent(rawLrc);
    expect(lines.length).toBe(2);
    expect(lines[0].text).toBe('Câu hát thật đầu tiên');
    expect(lines[0].timeMs).toBe(10500);
    expect(lines[1].text).toBe('Câu hát thật thứ hai');
    expect(lines[1].timeMs).toBe(20500);
  });

  it('preserves uncovered singing segments as missing-lyric gaps instead of deleting them when LRC is partial', () => {
    // Audio has 4 singing segments at 1s, 6s, 15s, 25s
    const starts = [1000, 6000, 15000, 25000];
    const bars: IVocalNoteBar[] = [];
    starts.forEach((s, idx) => {
      bars.push(
        {
          id: `gap-nb-${idx}-1`,
          startTimeMs: s,
          endTimeMs: s + 700,
          durationMs: 700,
          midi: 60,
          exactMidi: 60,
          noteName: 'C4',
          solfegeName: 'Đô 4',
          avgCentsDiff: 0,
          pointsCount: 15,
        },
        {
          id: `gap-nb-${idx}-2`,
          startTimeMs: s + 750,
          endTimeMs: s + 1600,
          durationMs: 850,
          midi: 64,
          exactMidi: 64,
          noteName: 'E4',
          solfegeName: 'Mi 4',
          avgCentsDiff: 0,
          pointsCount: 15,
        }
      );
    });

    const phrases: IVocalPhrase[] = starts.map((s, idx) => ({
      id: `p-gap-${idx}`,
      phraseIndex: idx + 1,
      startMs: s,
      endMs: s + 1600,
      durationMs: 1600,
      notes: ['C4', 'E4'],
      lowestNote: 'C4',
      highestNote: 'E4',
      avgPitchHz: 293,
      avgMidi: 62,
      pitchJumpSemitones: 4,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 30,
    }));

    // LRC only covers the first 2 lines (1s and 6s), missing 15s and 25s!
    const partialLrc: ILrcLine[] = [
      { timeMs: 1000, text: 'Câu một đủ' },
      { timeMs: 6000, text: 'Câu hai đủ' },
    ];

    alignLrcLinesToPhrases(phrases, bars, partialLrc, null, 44100, [], 28000);
    // Should preserve all 4 phrases (2 with LRC + 2 missing-lyric gaps)
    expect(phrases.length).toBe(4);
    expect(phrases[0].lyricText).toBe('Câu một đủ');
    expect(phrases[2].isMissingLyricGap).toBe(true);
    expect(phrases[3].isMissingLyricGap).toBe(true);

    const audit = auditLyricAlignmentHealth(phrases, bars);
    expect(audit.status).toBe('partial_gaps');
    expect(audit.missingGapRanges.length).toBe(2);
  });

  it('flags mismatch_suspected in auditLyricAlignmentHealth when LRC lines fall into empty audio', () => {
    const bars: IVocalNoteBar[] = [
      {
        id: 'mm-1',
        startTimeMs: 1000,
        endTimeMs: 2500,
        durationMs: 1500,
        midi: 60,
        exactMidi: 60,
        noteName: 'C4',
        solfegeName: 'Đô 4',
        avgCentsDiff: 0,
        pointsCount: 20,
      },
    ];
    const phrases: IVocalPhrase[] = [
      {
        id: 'mm-p1',
        phraseIndex: 1,
        startMs: 30000,
        endMs: 32000,
        durationMs: 2000,
        notes: ['C4'],
        lowestNote: 'C4',
        highestNote: 'C4',
        avgPitchHz: 261,
        avgMidi: 60,
        pitchJumpSemitones: 0,
        difficulty: 'Dễ',
        difficultyScore: 2,
        pointsCount: 0,
        lyricText: 'Câu một bị sai giờ',
      },
      {
        id: 'mm-p2',
        phraseIndex: 2,
        startMs: 40000,
        endMs: 42000,
        durationMs: 2000,
        notes: ['C4'],
        lowestNote: 'C4',
        highestNote: 'C4',
        avgPitchHz: 261,
        avgMidi: 60,
        pitchJumpSemitones: 0,
        difficulty: 'Dễ',
        difficultyScore: 2,
        pointsCount: 0,
        lyricText: 'Câu hai bị sai giờ',
      },
    ];

    const audit = auditLyricAlignmentHealth(phrases, bars);
    expect(audit.status).toBe('mismatch_suspected');
    expect(audit.emptyAudioRatio).toBeGreaterThan(0.5);
  });

  it('aligns plain text without losing trailing lines via Density DP when line count exceeds phrase count', () => {
    const bars: IVocalNoteBar[] = [
      { id: 'pt-1', startTimeMs: 1000, endTimeMs: 1800, durationMs: 800, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 15 },
      { id: 'pt-2', startTimeMs: 1900, endTimeMs: 2800, durationMs: 900, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Rê 4', avgCentsDiff: 0, pointsCount: 15 },
      { id: 'pt-3', startTimeMs: 4000, endTimeMs: 5500, durationMs: 1500, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 20 },
      { id: 'pt-4', startTimeMs: 5600, endTimeMs: 7000, durationMs: 1400, midi: 67, exactMidi: 67, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 20 },
    ];
    const phrases: IVocalPhrase[] = [
      { id: 'pt-p1', phraseIndex: 1, startMs: 1000, endMs: 2800, durationMs: 1800, notes: ['C4', 'D4'], lowestNote: 'C4', highestNote: 'D4', avgPitchHz: 277, avgMidi: 61, pitchJumpSemitones: 2, difficulty: 'Dễ', difficultyScore: 3, pointsCount: 30 },
      { id: 'pt-p2', phraseIndex: 2, startMs: 4000, endMs: 7000, durationMs: 3000, notes: ['E4', 'G4'], lowestNote: 'E4', highestNote: 'G4', avgPitchHz: 350, avgMidi: 65, pitchJumpSemitones: 3, difficulty: 'Dễ', difficultyScore: 3, pointsCount: 40 },
    ];

    const plainText = [
      'Dòng một ngắn',
      'Dòng hai nối liền',
      'Dòng ba cuối bài',
    ].join('\n');

    alignPlainTextToPhrases(phrases, bars, plainText, null, 44100, []);
    const joinedAll = phrases.map((p) => p.lyricText).join(' ');
    expect(joinedAll).toContain('Dòng một ngắn');
    expect(joinedAll).toContain('Dòng ba cuối bài');
  });

  it('recovers from severe LRC timestamp mismatch (e.g. +10s interlude cut) via structural subsequence DP', () => {
    // Audio has 4 singing phrases at 1s, 5s, 9s, 13s
    const actualStarts = [1000, 5000, 9000, 13000];
    const wordCounts = [3, 4, 3, 5];
    const bars: IVocalNoteBar[] = [];
    actualStarts.forEach((s, pIdx) => {
      for (let b = 0; b < wordCounts[pIdx]; b++) {
        bars.push({
          id: `subseq-b-${pIdx}-${b}`,
          startTimeMs: s + b * 450,
          endTimeMs: s + b * 450 + 380,
          durationMs: 380,
          midi: 60 + b,
          exactMidi: 60 + b,
          noteName: 'C4',
          solfegeName: 'Đô 4',
          avgCentsDiff: 0,
          pointsCount: 12,
        });
      }
    });

    const phrases: IVocalPhrase[] = actualStarts.map((s, pIdx) => ({
      id: `subseq-p-${pIdx}`,
      phraseIndex: pIdx + 1,
      startMs: s,
      endMs: s + wordCounts[pIdx] * 450,
      durationMs: wordCounts[pIdx] * 450,
      notes: ['C4', 'D4', 'E4'],
      lowestNote: 'C4',
      highestNote: 'E4',
      avgPitchHz: 280,
      avgMidi: 61,
      pitchJumpSemitones: 2,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 36,
    }));

    // LRC timestamps for lines 3 and 4 are shifted +12000ms (e.g. audio cut an interlude!)
    const brokenLrc: ILrcLine[] = [
      { timeMs: 1000, text: 'Một hai ba' },
      { timeMs: 5000, text: 'Bốn năm sáu bảy' },
      { timeMs: 21000, text: 'Tám chín mười' },
      { timeMs: 25000, text: 'Mười một hai ba bốn năm' },
    ];

    alignLrcLinesToPhrases(phrases, bars, brokenLrc, null, 44100, [], 16500);
    expect(phrases.length).toBe(4);
    expect(phrases[2].lyricText).toBe('Tám chín mười');
    expect(phrases[2].startMs).toBe(9000);
    expect(phrases[3].lyricText).toBe('Mười một hai ba bốn năm');
    expect(phrases[3].startMs).toBe(13000);
  });

  it('auto-generates lyrics for missing Chorus 2 via Melodic Interval Self-Similarity Clone (even if transposed)', () => {
    // Chorus 1 at 1000ms: C4(60) -> E4(64) -> G4(67) -> A4(69) -> G4(67)
    // Chorus 2 (missing from LRC!) at 10000ms: transposed up +2 semitones: D4(62) -> F#4(66) -> A4(69) -> B4(71) -> A4(69)
    const chorus1Midis = [60, 64, 67, 69, 67];
    const chorus2Midis = [62, 66, 69, 71, 69];
    const bars: IVocalNoteBar[] = [
      ...chorus1Midis.map((m, i) => ({
        id: `mc-1-${i}`,
        startTimeMs: 1000 + i * 450,
        endTimeMs: 1000 + i * 450 + 380,
        durationMs: 380,
        midi: m,
        exactMidi: m,
        noteName: 'C4',
        solfegeName: 'Đô 4',
        avgCentsDiff: 0,
        pointsCount: 12,
      })),
      ...chorus2Midis.map((m, i) => ({
        id: `mc-2-${i}`,
        startTimeMs: 10000 + i * 450,
        endTimeMs: 10000 + i * 450 + 380,
        durationMs: 380,
        midi: m,
        exactMidi: m,
        noteName: 'D4',
        solfegeName: 'Rê 4',
        avgCentsDiff: 0,
        pointsCount: 12,
      })),
    ];

    const phrases: IVocalPhrase[] = [
      {
        id: 'mc-p1',
        phraseIndex: 1,
        startMs: 1000,
        endMs: 3200,
        durationMs: 2200,
        notes: ['C4', 'E4', 'G4', 'A4'],
        lowestNote: 'C4',
        highestNote: 'A4',
        avgPitchHz: 340,
        avgMidi: 65,
        pitchJumpSemitones: 4,
        difficulty: 'Dễ',
        difficultyScore: 3,
        pointsCount: 60,
      },
      {
        id: 'mc-p2',
        phraseIndex: 2,
        startMs: 10000,
        endMs: 12200,
        durationMs: 2200,
        notes: ['D4', 'F#4', 'A4', 'B4'],
        lowestNote: 'D4',
        highestNote: 'B4',
        avgPitchHz: 380,
        avgMidi: 67,
        pitchJumpSemitones: 4,
        difficulty: 'Dễ',
        difficultyScore: 3,
        pointsCount: 60,
      },
    ];

    const partialLrc: ILrcLine[] = [{ timeMs: 1000, text: 'Người ơi đừng bỏ đi' }];
    alignLrcLinesToPhrases(phrases, bars, partialLrc, null, 44100, [], 14000);

    expect(phrases.length).toBe(2);
    expect(phrases[1].lyricText).toBe('Người ơi đừng bỏ đi');
    expect(phrases[1].isAutoGeneratedMissing).toBe(true);
    expect(phrases[1].autoGenSource).toBe('melodic_clone');
  });

  it('auto-synthesizes singable phonetic syllables for non-repeating missing Bridge segments', () => {
    const bars: IVocalNoteBar[] = [
      { id: 'ps-1-0', startTimeMs: 1000, endTimeMs: 1400, durationMs: 400, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'ps-1-1', startTimeMs: 1450, endTimeMs: 1900, durationMs: 450, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Rê 4', avgCentsDiff: 0, pointsCount: 10 },
      // Missing unique 4-note bridge at 10s
      { id: 'ps-2-0', startTimeMs: 10000, endTimeMs: 10400, durationMs: 400, midi: 67, exactMidi: 67, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'ps-2-1', startTimeMs: 10450, endTimeMs: 10900, durationMs: 450, midi: 71, exactMidi: 71, noteName: 'B4', solfegeName: 'Si 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'ps-2-2', startTimeMs: 10950, endTimeMs: 11400, durationMs: 450, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'ps-2-3', startTimeMs: 11450, endTimeMs: 12400, durationMs: 950, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 20 },
    ];
    const phrases: IVocalPhrase[] = [
      { id: 'ps-p1', phraseIndex: 1, startMs: 1000, endMs: 1900, durationMs: 900, notes: ['C4', 'D4'], lowestNote: 'C4', highestNote: 'D4', avgPitchHz: 277, avgMidi: 61, pitchJumpSemitones: 2, difficulty: 'Dễ', difficultyScore: 2, pointsCount: 20 },
      { id: 'ps-p2', phraseIndex: 2, startMs: 10000, endMs: 12400, durationMs: 2400, notes: ['G4', 'B4', 'E4', 'C4'], lowestNote: 'C4', highestNote: 'B4', avgPitchHz: 350, avgMidi: 65, pitchJumpSemitones: 7, difficulty: 'Trung bình', difficultyScore: 5, pointsCount: 50 },
    ];

    const partialLrc: ILrcLine[] = [{ timeMs: 1000, text: 'Mùa thu' }];
    alignLrcLinesToPhrases(phrases, bars, partialLrc, null, 44100, [], 13000);

    expect(phrases.length).toBe(2);
    expect(phrases[1].isAutoGeneratedMissing).toBe(true);
    expect(phrases[1].autoGenSource).toBe('phonetic_synth');
    expect(phrases[1].words?.length).toBe(4);
    expect(phrases[1].lyricText).not.toContain('Nguyên âm:');
  });

  it('rebuilds phrases via structural subsequence DP when phrases.length !== L and >=35% of LRC lines are shifted out of bounds', () => {
    // 5 audio phrases at 1s, 5s, 9s, 13s, 18s (phrase 5 is an extra missing bridge)
    const actualStarts = [1000, 5000, 9000, 13000, 18000];
    const counts = [3, 4, 3, 4, 2];
    const bars: IVocalNoteBar[] = [];
    actualStarts.forEach((s, pIdx) => {
      for (let b = 0; b < counts[pIdx]; b++) {
        bars.push({
          id: `st-b-${pIdx}-${b}`,
          startTimeMs: s + b * 400,
          endTimeMs: s + b * 400 + 330,
          durationMs: 330,
          midi: 60 + b,
          exactMidi: 60 + b,
          noteName: 'C4',
          solfegeName: 'Đô 4',
          avgCentsDiff: 0,
          pointsCount: 10,
        });
      }
    });
    const phrases: IVocalPhrase[] = actualStarts.map((s, pIdx) => ({
      id: `st-p-${pIdx}`,
      phraseIndex: pIdx + 1,
      startMs: s,
      endMs: s + counts[pIdx] * 400,
      durationMs: counts[pIdx] * 400,
      notes: ['C4', 'D4'],
      lowestNote: 'C4',
      highestNote: 'D4',
      avgPitchHz: 277,
      avgMidi: 61,
      pitchJumpSemitones: 2,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 25,
    }));

    // 4 LRC lines where lines 2, 3, 4 have completely wrong timestamps (+25s shifted!)
    const badLrc: ILrcLine[] = [
      { timeMs: 1000, text: 'Một hai ba' },
      { timeMs: 30000, text: 'Bốn năm sáu bảy' },
      { timeMs: 35000, text: 'Tám chín mười' },
      { timeMs: 40000, text: 'Mười một hai ba' },
    ];

    alignLrcLinesToPhrases(phrases, bars, badLrc, null, 44100, [], 20000);
    // Should recover all 4 LRC lines onto the real 5s, 9s, 13s clusters despite bad timestamps, and synthesize missing phrase 5!
    expect(phrases.length).toBe(5);
    expect(phrases[1].lyricText).toBe('Bốn năm sáu bảy');
    expect(phrases[1].startMs).toBe(5000);
    expect(phrases[2].lyricText).toBe('Tám chín mười');
    expect(phrases[2].startMs).toBe(9000);
    expect(phrases[4].isAutoGeneratedMissing).toBe(true);
  });
});
