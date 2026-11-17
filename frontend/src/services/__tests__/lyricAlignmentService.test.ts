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
  findActiveWordIndexAtTime,
  ILrcLine,
} from '../lyricAlignmentService';
import {
  buildClusterPhoneticProfilesAsync,
  buildPhoneticSyllableIndex,
  profileAudioClusterPhonetics,
  queryIndexedClusterProfile,
  rescueUnvoicedVocalPhrasesFromPcm,
} from '../acousticPhoneticProfiler';
import { findSparseAnchorChainOffsets } from '../sequenceAlignmentEngine';
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
      181000
    );
    expect(resCanGiNoiIu?.syncedLyrics).toContain('[00:13.84]Hoodie lông gấu, baby girl em thật ngầu');
    expect(resCanGiNoiIu?.syncedLyrics).toContain('Đồ này khá trôi, em cũng khá say');
    expect(resCanGiNoiIu?.syncedLyrics).toContain('Bởi vì all I want for Christmas is you');

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

  it('auto-generates missing preceding singing section before first LRC line and fixes shifted lines even when phrases.length === L', () => {
    // Cluster 1 at 2s..3.5s (preceding singing section missing from LRC — 2 varied notes >= 650ms)
    // Cluster 2 at 8s..9.6s (4 notes), Cluster 3 at 13s..14.6s (4 notes)
    const bars: IVocalNoteBar[] = [
      { id: 'pre-1', startTimeMs: 2000, endTimeMs: 2450, durationMs: 450, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'pre-2', startTimeMs: 2500, endTimeMs: 3100, durationMs: 600, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 10 },
      ...[0, 1, 2, 3].map((k) => ({
        id: `c2-${k}`, startTimeMs: 8000 + k * 400, endTimeMs: 8350 + k * 400, durationMs: 350, midi: 62 + k, exactMidi: 62 + k, noteName: 'D4', solfegeName: 'Re 4', avgCentsDiff: 0, pointsCount: 10,
      })),
      ...[0, 1, 2, 3].map((k) => ({
        id: `c3-${k}`, startTimeMs: 13000 + k * 400, endTimeMs: 13350 + k * 400, durationMs: 350, midi: 65 + k, exactMidi: 65 + k, noteName: 'F4', solfegeName: 'Fa 4', avgCentsDiff: 0, pointsCount: 10,
      })),
    ];

    // Coincidentally 3 phrases === 3 LRC lines, where LRC is missing the 2s section and has shifted timestamps!
    const phrases: IVocalPhrase[] = [
      { id: 'p1', phraseIndex: 1, startMs: 2000, endMs: 3100, durationMs: 1100, contour: 'rising', contourLabel: '', avgMidi: 62, lowestMidi: 60, highestMidi: 64, lowestNote: 'C4', highestNote: 'E4', pitchJumpSemitones: 4, notes: [] },
      { id: 'p2', phraseIndex: 2, startMs: 8000, endMs: 9550, durationMs: 1550, contour: 'rising', contourLabel: '', avgMidi: 63, lowestMidi: 62, highestMidi: 65, lowestNote: 'D4', highestNote: 'F4', pitchJumpSemitones: 3, notes: [] },
      { id: 'p3', phraseIndex: 3, startMs: 13000, endMs: 14550, durationMs: 1550, contour: 'rising', contourLabel: '', avgMidi: 66, lowestMidi: 65, highestMidi: 68, lowestNote: 'F4', highestNote: 'G#4', pitchJumpSemitones: 3, notes: [] },
    ];

    const lrcMissingPreceding: ILrcLine[] = [
      { timeMs: 8000, text: 'Câu hát thứ nhất' },
      { timeMs: 13000, text: 'Câu hát thứ hai' },
      { timeMs: 28000, text: 'Câu hát bị lệch xa' },
    ];

    alignLrcLinesToPhrases(phrases, bars, lrcMissingPreceding, null, 44100, [], 16000);
    // Preceding section at 2000ms must be preserved & auto-generated instead of dropped!
    expect(phrases[0].startMs).toBe(2000);
    expect(phrases[0].isAutoGeneratedMissing).toBe(true);
    expect(phrases[0].words?.length).toBe(2);
  });

  it('parses YouTube transcripts, SRT/VTT subtitles, and YouTube JSON3 captions cleanly', () => {
    const ytTwoLine = `0:14\nHoodie lông gấu, baby girl em thật ngầu\n0:16\nTrời hôm nay hơi rét nên má em đậm màu`;
    const parsedYt = parseLrcContent(ytTwoLine);
    expect(parsedYt).toHaveLength(2);
    expect(parsedYt[0]).toEqual({ timeMs: 14000, text: 'Hoodie lông gấu, baby girl em thật ngầu' });
    expect(parsedYt[1]).toEqual({ timeMs: 16000, text: 'Trời hôm nay hơi rét nên má em đậm màu' });

    const ytInline = `0:14 Hoodie lông gấu, baby girl em thật ngầu\n1:02:15 Câu cuối cùng`;
    const parsedInline = parseLrcContent(ytInline);
    expect(parsedInline).toHaveLength(2);
    expect(parsedInline[0].timeMs).toBe(14000);
    expect(parsedInline[1].timeMs).toBe(3735000);

    const srt = `1\n00:00:13,840 --> 00:00:15,720\nHoodie lông gấu, baby girl em thật ngầu\n\n2\n00:00:15,720 --> 00:00:17,590\n<i>Trời hôm nay hơi rét</i>`;
    const parsedSrt = parseLrcContent(srt);
    expect(parsedSrt).toHaveLength(2);
    expect(parsedSrt[0].timeMs).toBe(13840);
    expect(parsedSrt[1].text).toBe('Trời hôm nay hơi rét');

    const json3 = JSON.stringify({
      events: [
        { tStartMs: 13840, segs: [{ utf8: 'Hoodie lông gấu' }] },
        { tStartMs: 15720, segs: [{ utf8: 'Trời hôm nay ' }, { utf8: 'hơi rét' }] },
      ],
    });
    const parsedJson3 = parseLrcContent(json3);
    expect(parsedJson3).toHaveLength(2);
    expect(parsedJson3[1]).toEqual({ timeMs: 15720, text: 'Trời hôm nay hơi rét' });
  });

  it('reports DP recovery and Auto-Gen engine telemetry in auditLyricAlignmentHealth', () => {
    const bars: IVocalNoteBar[] = [
      ...[0, 1, 2, 3].map((k) => ({
        id: `a-${k}`, startTimeMs: 1000 + k * 400, endTimeMs: 1350 + k * 400, durationMs: 350, midi: 60 + k, exactMidi: 60 + k, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 10,
      })),
      ...[0, 1, 2, 3].map((k) => ({
        id: `b-${k}`, startTimeMs: 5000 + k * 400, endTimeMs: 5350 + k * 400, durationMs: 350, midi: 62 + k, exactMidi: 62 + k, noteName: 'D4', solfegeName: 'Re 4', avgCentsDiff: 0, pointsCount: 10,
      })),
      ...[0, 1, 2, 3].map((k) => ({
        id: `c-${k}`, startTimeMs: 9000 + k * 400, endTimeMs: 9350 + k * 400, durationMs: 350, midi: 65 + k, exactMidi: 65 + k, noteName: 'F4', solfegeName: 'Fa 4', avgCentsDiff: 0, pointsCount: 10,
      })),
      // Repeated transposed chorus melody at 13s (missing from LRC)
      ...[0, 1, 2, 3].map((k) => ({
        id: `d-${k}`, startTimeMs: 13000 + k * 400, endTimeMs: 13350 + k * 400, durationMs: 350, midi: 67 + k, exactMidi: 67 + k, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 10,
      })),
    ];

    const phrases: IVocalPhrase[] = [
      { id: 'p1', phraseIndex: 1, startMs: 1000, endMs: 2550, durationMs: 1550, contour: 'rising', contourLabel: '', avgMidi: 62, lowestMidi: 60, highestMidi: 63, lowestNote: 'C4', highestNote: 'D#4', pitchJumpSemitones: 3, notes: [] },
    ];
    const brokenLrc: ILrcLine[] = [
      { timeMs: 1000, text: 'Một hai ba bốn' },
      { timeMs: 25000, text: 'Năm sáu bảy tám' },
      { timeMs: 30000, text: 'Chín mười một hai' },
    ];

    alignLrcLinesToPhrases(phrases, bars, brokenLrc, null, 44100, [], 16000);
    const report = auditLyricAlignmentHealth(phrases, bars);
    expect(report.recoveredDpCount).toBeGreaterThanOrEqual(2);
    expect(report.autoGenCloneCount).toBeGreaterThanOrEqual(1);
    expect(report.engineSummaryVi).toContain('DP');
  });

  it('recovers true global offset via consensus histogram even when lrcLines[0] mismatches phrases[0]', () => {
    const phrases: IVocalPhrase[] = [
      { id: 'p1', phraseIndex: 1, startMs: 18000, endMs: 20500, durationMs: 2500, contour: 'rising', contourLabel: '', avgMidi: 62, lowestMidi: 60, highestMidi: 64, lowestNote: 'C4', highestNote: 'E4', pitchJumpSemitones: 4, notes: [] },
      { id: 'p2', phraseIndex: 2, startMs: 22000, endMs: 24500, durationMs: 2500, contour: 'rising', contourLabel: '', avgMidi: 64, lowestMidi: 62, highestMidi: 65, lowestNote: 'D4', highestNote: 'F4', pitchJumpSemitones: 3, notes: [] },
      { id: 'p3', phraseIndex: 3, startMs: 26000, endMs: 28500, durationMs: 2500, contour: 'falling', contourLabel: '', avgMidi: 62, lowestMidi: 60, highestMidi: 64, lowestNote: 'C4', highestNote: 'E4', pitchJumpSemitones: 4, notes: [] },
    ];
    const bars: IVocalNoteBar[] = [
      { id: 'b1', startTimeMs: 18000, endTimeMs: 20400, durationMs: 2400, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Re 4', avgCentsDiff: 0, pointsCount: 20 },
      { id: 'b2', startTimeMs: 22000, endTimeMs: 24400, durationMs: 2400, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 20 },
      { id: 'b3', startTimeMs: 26000, endTimeMs: 28400, durationMs: 2400, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Re 4', avgCentsDiff: 0, pointsCount: 20 },
    ];
    // LRC line 0 is an extra intro spoken tag at 2s; real sung lines 1..3 are shifted +7000ms (25s, 29s, 33s) -> true offset = -7000ms
    const shiftedLrc: ILrcLine[] = [
      { timeMs: 2000, text: 'Intro producer tag' },
      { timeMs: 25000, text: 'Câu hát đầu tiên' },
      { timeMs: 29000, text: 'Câu hát thứ hai' },
      { timeMs: 33000, text: 'Câu hát thứ ba' },
    ];

    const bestOffset = estimateOptimalLrcOffsetMs(phrases, bars, shiftedLrc, 35000);
    expect(Math.abs(bestOffset - (-7000))).toBeLessThanOrEqual(300);
  });

  it('anchors rapid W > B Enhanced LRC words onto timestamp-matched NoteBars and synthesizes tone-concordant fallback syllables', () => {
    const bars: IVocalNoteBar[] = [
      { id: 'rb1', startTimeMs: 1000, endTimeMs: 1600, durationMs: 600, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 20 },
      { id: 'rb2', startTimeMs: 1650, endTimeMs: 2400, durationMs: 750, midi: 67, exactMidi: 67, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 20 },
      // Missing phrase with big pitch steps (+5 then -5)
      { id: 'rb3', startTimeMs: 5000, endTimeMs: 5400, durationMs: 400, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'rb4', startTimeMs: 5450, endTimeMs: 5850, durationMs: 400, midi: 65, exactMidi: 65, noteName: 'F4', solfegeName: 'Fa 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'rb5', startTimeMs: 5900, endTimeMs: 6300, durationMs: 400, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 10 },
    ];
    const phrases: IVocalPhrase[] = [
      { id: 'p1', phraseIndex: 1, startMs: 1000, endMs: 2400, durationMs: 1400, contour: 'rising', contourLabel: '', avgMidi: 63.5, lowestMidi: 60, highestMidi: 67, lowestNote: 'C4', highestNote: 'G4', pitchJumpSemitones: 7, notes: [] },
      { id: 'p2', phraseIndex: 2, startMs: 5000, endMs: 6300, durationMs: 1300, contour: 'arch', contourLabel: '', avgMidi: 61.7, lowestMidi: 60, highestMidi: 65, lowestNote: 'C4', highestNote: 'F4', pitchJumpSemitones: 5, notes: [] },
    ];
    const lrc: ILrcLine[] = [
      {
        timeMs: 1000,
        text: 'Một hai ba bốn năm',
        wordTimestamps: [
          { timeMs: 1050, text: 'Một' },
          { timeMs: 1300, text: 'hai' },
          { timeMs: 1750, text: 'ba' },
          { timeMs: 1950, text: 'bốn' },
          { timeMs: 2200, text: 'năm' },
        ],
      },
    ];

    alignLrcLinesToPhrases(phrases, bars, lrc, null, 44100, [], 7000);
    expect(phrases[0].words?.length).toBe(5);
    // Word "ba" at 1750ms must map onto rb2 (G4 = 67) rather than drifting into rb1 (C4 = 60)!
    expect(phrases[0].words?.[2].midi).toBe(67);
    // Phrase 2 synthesized with tone-concordant rising (+5 st) and falling (-5 st) syllables
    expect(phrases[1].isAutoGeneratedMissing).toBe(true);
    expect(phrases[1].words?.[1].toneType).toBe('sac');
    expect(phrases[1].words?.[2].toneType).toBe('huyen');
  });

  it('force-aligns asymmetric syllables tightly to real modulated PCM energy & formant shifts and splits flat bars', () => {
    const sr = 16000;
    const durSec = 1.9;
    const pcm = new Float32Array(Math.round(sr * durSec));
    // Construct realistic 3-word vocal contour in [0.05s..1.85s]:
    // 0.05..0.32s: Checked word 1 ("Tất") -> brief vowel 720Hz then quiet dip 0.32..0.46s
    // 0.46..1.38s: Long sustained word 2 ("yêu") -> strong sustained formant 1250Hz + 360Hz
    // 1.38..1.48s: Dip/nasal transition
    // 1.48..1.80s: Word 3 ("em") -> shifted formant 2100Hz
    for (let i = 0; i < pcm.length; i++) {
      const t = i / sr;
      if (t >= 0.05 && t < 0.32) {
        pcm[i] = 0.4 * Math.sin(2 * Math.PI * 720 * t) + 0.12 * Math.sin(2 * Math.PI * 3200 * t);
      } else if (t >= 0.32 && t < 0.46) {
        pcm[i] = 0.015 * Math.sin(2 * Math.PI * 260 * t);
      } else if (t >= 0.46 && t < 1.38) {
        pcm[i] = 0.55 * Math.sin(2 * Math.PI * 1250 * t) + 0.25 * Math.sin(2 * Math.PI * 360 * t);
      } else if (t >= 1.38 && t < 1.48) {
        pcm[i] = 0.02 * Math.sin(2 * Math.PI * 260 * t);
      } else if (t >= 1.48 && t < 1.80) {
        pcm[i] = 0.42 * Math.sin(2 * Math.PI * 2100 * t) + 0.2 * Math.sin(2 * Math.PI * 360 * t);
      }
    }

    const singleMergedBar: IVocalNoteBar[] = [
      {
        id: 'flat-phrase-bar',
        startTimeMs: 50,
        endTimeMs: 1800,
        durationMs: 1750,
        midi: 64,
        exactMidi: 64,
        noteName: 'E4',
        solfegeName: 'Mi 4',
        avgCentsDiff: 0,
        pointsCount: 100,
      },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-fa',
      phraseIndex: 1,
      startMs: 50,
      endMs: 1800,
      durationMs: 1750,
      contour: 'level',
      contourLabel: '',
      avgMidi: 64,
      lowestMidi: 64,
      highestMidi: 64,
      lowestNote: 'E4',
      highestNote: 'E4',
      pitchJumpSemitones: 0,
      notes: ['E4'],
      difficulty: 'Dễ',
      difficultyScore: 2,
      pointsCount: 100,
    };

    alignWordsToPhraseNoteBars(phrase, singleMergedBar, 'Tất yêu em', pcm, sr, []);
    expect(phrase.words).toHaveLength(3);
    const w0 = phrase.words![0];
    const w1 = phrase.words![1];
    const w2 = phrase.words![2];
    // Word 2 ("yêu") must capture the long sustained center [~460..1380ms], much longer than checked word 1 ("Tất")!
    expect(w1.durationMs!).toBeGreaterThan(w0.durationMs! + 220);
    expect(w1.startMs).toBeGreaterThanOrEqual(280);
    expect(w1.startMs).toBeLessThanOrEqual(560);
    expect(w2.startMs).toBeGreaterThanOrEqual(1200);
    // Forced alignment also splits the merged bar into per-syllable blocks on singleMergedBar
    expect(singleMergedBar.length).toBeGreaterThanOrEqual(2);
  });

  it('skips inter-bar silence gaps when computing active-time word mapping without PCM', () => {
    // Bar 0: 1000..1300 (300ms), GAP 700ms, Bar 1: 2000..2900 (900ms) -> 3 rapid words
    const bars: IVocalNoteBar[] = [
      { id: 'gb-1', startTimeMs: 1000, endTimeMs: 1300, durationMs: 300, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 10 },
      { id: 'gb-2', startTimeMs: 2000, endTimeMs: 2900, durationMs: 900, midi: 67, exactMidi: 67, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 30 },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-gb',
      phraseIndex: 1,
      startMs: 1000,
      endMs: 2900,
      durationMs: 1900,
      contour: 'rising',
      contourLabel: '',
      avgMidi: 63.5,
      lowestMidi: 60,
      highestMidi: 67,
      lowestNote: 'C4',
      highestNote: 'G4',
      pitchJumpSemitones: 7,
      notes: ['C4', 'G4'],
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 40,
    };
    alignWordsToPhraseNoteBars(phrase, bars, 'Một hai ba bốn năm sáu', null, 44100, [], undefined, true);
    expect(phrase.words).toHaveLength(6);
    // Word 3 ("bốn", middle of phrase) must map to Bar 1 (2000..2900) rather than drifting into silence gap or Bar 0!
    expect(phrase.words![3].startMs).toBeGreaterThanOrEqual(2000);
    expect(phrase.words![3].midi).toBe(67);
  });

  it('repairs localized <35% phrase cascade via Anchor-Constrained Local Window DP without moving outer anchors', () => {
    // 10 audio phrases at 1s, 5s, 9s, 13s, 17s, 21s, 25s, 29s, 33s, 37s
    // Phrases 0..3 and 7..9 match cleanly. Around 4..6 (17s..25s), LRC has an extra omitted line
    // and shifted timestamps trying to push line 5 onto phrase 4 and leave phrase 6 orphaned!
    const starts = [1000, 5000, 9000, 13000, 17000, 21000, 25000, 29000, 33000, 37000];
    const barCounts = [4, 4, 4, 4, 5, 3, 4, 4, 4, 4];
    const bars: IVocalNoteBar[] = [];
    starts.forEach((s, pIdx) => {
      for (let b = 0; b < barCounts[pIdx]; b++) {
        bars.push({
          id: `loc-${pIdx}-${b}`,
          startTimeMs: s + b * 360,
          endTimeMs: s + b * 360 + 300,
          durationMs: 300,
          midi: 60 + (b % 4),
          exactMidi: 60 + (b % 4),
          noteName: 'C4',
          solfegeName: 'Do 4',
          avgCentsDiff: 0,
          pointsCount: 12,
        });
      }
    });
    const phrases: IVocalPhrase[] = starts.map((s, pIdx) => ({
      id: `loc-p-${pIdx}`,
      phraseIndex: pIdx + 1,
      startMs: s,
      endMs: s + barCounts[pIdx] * 360,
      durationMs: barCounts[pIdx] * 360,
      notes: ['C4', 'D4'],
      lowestNote: 'C4',
      highestNote: 'D#4',
      avgPitchHz: 280,
      avgMidi: 62,
      pitchJumpSemitones: 3,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 40,
    }));

    // 11 LRC lines (<35% damaged region: lines 0..3 clean, line 4 omitted/bad at 16.5s,
    // lines 5,6,7 correspond to 17s (5w), 21s (3w), 25s (4w) but shifted slightly in LRC, lines 8..10 clean at 29s..37s)
    const lrcLines: ILrcLine[] = [
      { timeMs: 1000, text: 'Câu số một chuẩn' },
      { timeMs: 5000, text: 'Câu số hai chuẩn' },
      { timeMs: 9000, text: 'Câu số ba chuẩn' },
      { timeMs: 13000, text: 'Câu số bốn chuẩn' },
      { timeMs: 16200, text: 'Câu thừa đã bỏ qua không hát' }, // Omitted extra line (7w)
      { timeMs: 18900, text: 'Câu năm có năm âm' },              // Belongs to 17000ms (5 bars)
      { timeMs: 22900, text: 'Câu sáu ba' },                    // Belongs to 21000ms (3 bars)
      { timeMs: 26600, text: 'Câu bảy bốn từ' },                // Belongs to 25000ms (4 bars)
      { timeMs: 29000, text: 'Câu số tám chuẩn' },
      { timeMs: 33000, text: 'Câu số chín chuẩn' },
      { timeMs: 37000, text: 'Câu số mười chuẩn' },
    ];

    alignLrcLinesToPhrases(phrases, bars, lrcLines, null, 44100, [], 40000);
    expect(phrases.length).toBe(10);
    expect(phrases[0].lyricText).toBe('Câu số một chuẩn');
    expect(phrases[3].lyricText).toBe('Câu số bốn chuẩn');
    expect(phrases[4].lyricText).toBe('Câu năm có năm âm');
    expect(phrases[5].lyricText).toBe('Câu sáu ba');
    expect(phrases[6].lyricText).toBe('Câu bảy bốn từ');
    // Outer right anchors stay 100% immune
    expect(phrases[7].lyricText).toBe('Câu số tám chuẩn');
    expect(phrases[9].lyricText).toBe('Câu số mười chuẩn');
  });

  it('prevents sparse outlier onset from corrupting adjacent lines via Sparse Anchor-Chain + MAD rejection', () => {
    const lrcLines = [
      { timeMs: 1000, text: 'Một hai ba bốn' },
      { timeMs: 5000, text: 'Năm sáu bảy tám' },
      { timeMs: 9000, text: 'Chín mười một hai' },
      { timeMs: 13000, text: 'Ba bốn năm sáu' },
      { timeMs: 17000, text: 'Bảy tám chín mười' },
    ];
    // Onset 2 has an outlier drum spike at 10500ms (+1500ms spike), while surrounding lines smoothly stay at +200ms
    const phrases: IVocalPhrase[] = [1200, 5200, 10500, 13200, 17200].map((s, i) => ({
      id: `sp-p-${i}`,
      phraseIndex: i + 1,
      startMs: s,
      endMs: s + 1300,
      durationMs: 1300,
      notes: ['C4'],
      lowestNote: 'C4',
      highestNote: 'C4',
      avgPitchHz: 261,
      avgMidi: 60,
      pitchJumpSemitones: 0,
      difficulty: 'Dễ',
      difficultyScore: 2,
      pointsCount: 20,
    }));
    const bars: IVocalNoteBar[] = [1200, 5200, 10500, 13200, 17200].flatMap((s, i) =>
      [0, 1, 2, 3].map((k) => ({
        id: `sp-b-${i}-${k}`,
        startTimeMs: s + k * 310,
        endTimeMs: s + k * 310 + 260,
        durationMs: 260,
        midi: 60,
        exactMidi: 60,
        noteName: 'C4',
        solfegeName: 'Do 4',
        avgCentsDiff: 0,
        pointsCount: 10,
      }))
    );

    const offsets = findSparseAnchorChainOffsets({
      phrases,
      noteBars: bars,
      lrcLines,
      baseOffsetMs: 200,
    });
    // Neighbors around the spike must stay strictly at +200ms (not pulled toward +1500ms!)
    expect(Math.abs(offsets[1] - 200)).toBeLessThanOrEqual(50);
    expect(Math.abs(offsets[3] - 200)).toBeLessThanOrEqual(50);
    expect(Math.abs(offsets[2] - 200)).toBeLessThanOrEqual(150);
  });

  it('aligns plain text without cascading when audio starts with an extra missing vocal phrase (P > L)', () => {
    const starts = [1000, 5000, 9000, 13000];
    const counts = [2, 4, 4, 4]; // Phrase 0 (2 bars) is extra intro hum missing from pasted plain text
    const bars: IVocalNoteBar[] = [];
    starts.forEach((s, pi) => {
      for (let k = 0; k < counts[pi]; k++) {
        bars.push({
          id: `ptc-${pi}-${k}`,
          startTimeMs: s + k * 420,
          endTimeMs: s + k * 420 + 360,
          durationMs: 360,
          midi: 60 + k,
          exactMidi: 60 + k,
          noteName: 'C4',
          solfegeName: 'Do 4',
          avgCentsDiff: 0,
          pointsCount: 10,
        });
      }
    });
    const phrases: IVocalPhrase[] = starts.map((s, pi) => ({
      id: `ptc-p-${pi}`,
      phraseIndex: pi + 1,
      startMs: s,
      endMs: s + counts[pi] * 420,
      durationMs: counts[pi] * 420,
      notes: ['C4', 'D4'],
      lowestNote: 'C4',
      highestNote: 'D#4',
      avgPitchHz: 277,
      avgMidi: 62,
      pitchJumpSemitones: 2,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 30,
    }));

    alignPlainTextToPhrases(
      phrases,
      bars,
      'Dòng một bốn chữ\nDòng hai bốn chữ\nDòng ba bốn chữ',
      null,
      44100,
      []
    );
    expect(phrases.length).toBe(4);
    expect(phrases[0].isAutoGeneratedMissing).toBe(true);
    expect(phrases[1].lyricText).toBe('Dòng một bốn chữ');
    expect(phrases[2].lyricText).toBe('Dòng hai bốn chữ');
    expect(phrases[3].lyricText).toBe('Dòng ba bốn chữ');
  });

  it('absorbs internal comma breath pause in SIL state and prevents word-level domino drift across clauses', () => {
    const sr = 16000;
    const durSec = 2.6;
    const pcm = new Float32Array(Math.round(sr * durSec));
    // Clause 1: "Tất anh," -> 0.10..0.38s ("Tất" 720Hz), 0.42..0.92s ("anh," 1250Hz)
    // Breath Pause: 0.92..1.32s SILENCE
    // Clause 2: "em đừng buồn" -> 1.32..1.58s (2100Hz), 1.62..1.88s (1250Hz), 1.92..2.50s (360+720Hz)
    for (let i = 0; i < pcm.length; i++) {
      const t = i / sr;
      if (t >= 0.10 && t < 0.38) {
        pcm[i] = 0.45 * Math.sin(2 * Math.PI * 720 * t);
      } else if (t >= 0.42 && t < 0.92) {
        pcm[i] = 0.52 * Math.sin(2 * Math.PI * 1250 * t) + 0.2 * Math.sin(2 * Math.PI * 360 * t);
      } else if (t >= 1.32 && t < 1.58) {
        pcm[i] = 0.46 * Math.sin(2 * Math.PI * 2100 * t);
      } else if (t >= 1.62 && t < 1.88) {
        pcm[i] = 0.48 * Math.sin(2 * Math.PI * 1250 * t);
      } else if (t >= 1.92 && t < 2.50) {
        pcm[i] = 0.55 * Math.sin(2 * Math.PI * 360 * t) + 0.3 * Math.sin(2 * Math.PI * 720 * t);
      }
    }

    const bars: IVocalNoteBar[] = [
      { id: 'c1', startTimeMs: 100, endTimeMs: 920, durationMs: 820, midi: 62, exactMidi: 62, noteName: 'D4', solfegeName: 'Re 4', avgCentsDiff: 0, pointsCount: 25 },
      { id: 'c2', startTimeMs: 1320, endTimeMs: 2500, durationMs: 1180, midi: 65, exactMidi: 65, noteName: 'F4', solfegeName: 'Fa 4', avgCentsDiff: 0, pointsCount: 35 },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-clause',
      phraseIndex: 1,
      startMs: 100,
      endMs: 2500,
      durationMs: 2400,
      notes: ['D4', 'F4'],
      lowestNote: 'D4',
      highestNote: 'F4',
      avgPitchHz: 320,
      avgMidi: 64,
      pitchJumpSemitones: 3,
      difficulty: 'Dễ',
      difficultyScore: 3,
      pointsCount: 60,
    };

    alignWordsToPhraseNoteBars(phrase, bars, 'Tất anh, em đừng buồn', pcm, sr, [], undefined, true);
    expect(phrase.words).toHaveLength(5);
    // "anh," stops tightly before the 400ms comma pause instead of swallowing the pause!
    expect(phrase.words![1].endMs).toBeLessThanOrEqual(1050);
    // "em" snaps cleanly after the pause onto ~1320ms!
    expect(phrase.words![2].startMs).toBeGreaterThanOrEqual(1200);
    expect(phrase.words![4].startMs).toBeGreaterThanOrEqual(1780);
  });

  it('skips isolated leading breath micro-bar in partitionBarsToWordsDP without shifting all phrase words', () => {
    const bars: IVocalNoteBar[] = [
      // Stray 60ms intake breath click separated by 180ms gap
      { id: 'click-0', startTimeMs: 800, endTimeMs: 860, durationMs: 60, midi: 58, exactMidi: 58, noteName: 'A#3', solfegeName: 'La# 3', avgCentsDiff: 0, pointsCount: 2 },
      { id: 'real-1', startTimeMs: 1040, endTimeMs: 1380, durationMs: 340, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Do 4', avgCentsDiff: 0, pointsCount: 14 },
      { id: 'real-2', startTimeMs: 1420, endTimeMs: 1760, durationMs: 340, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 14 },
      { id: 'real-3', startTimeMs: 1800, endTimeMs: 2250, durationMs: 450, midi: 67, exactMidi: 67, noteName: 'G4', solfegeName: 'Sol 4', avgCentsDiff: 0, pointsCount: 18 },
    ];
    const phrase: IVocalPhrase = {
      id: 'p-click',
      phraseIndex: 1,
      startMs: 800,
      endMs: 2250,
      durationMs: 1450,
      notes: ['A#3', 'C4', 'E4', 'G4'],
      lowestNote: 'A#3',
      highestNote: 'G4',
      avgPitchHz: 310,
      avgMidi: 63,
      pitchJumpSemitones: 9,
      difficulty: 'Trung bình',
      difficultyScore: 5,
      pointsCount: 48,
    };

    alignWordsToPhraseNoteBars(phrase, bars, 'Người yêu ơi', null, 44100, [], undefined, true);
    expect(phrase.words).toHaveLength(3);
    // Word 0 ("Người") skips the 60ms click and locks straight onto C4 (real-1)!
    expect(phrase.words![0].midi).toBe(60);
    expect(phrase.words![1].midi).toBe(64);
    expect(phrase.words![2].midi).toBe(67);
  });

  it('strips YouTube [Âm nhạc]/[Music] captions and highlights strictly 1 exclusive word at boundaries', () => {
    const ytSubs = `0:00\n[Âm nhạc]\n0:14\n[Music]\n0:15\nHoodie lông gấu\n0:18\n(Vỗ tay)\n0:19\nEm thật ngầu`;
    const parsed = parseLrcContent(ytSubs);
    expect(parsed.map((l) => l.text)).toEqual(['Hoodie lông gấu', 'Em thật ngầu']);

    const mockWords = [
      { wordIndex: 0, startMs: 1000, endMs: 1300 },
      { wordIndex: 1, startMs: 1320, endMs: 1650 },
    ];
    // Right at seam 1310ms, strictly at most 1 exclusive word can be active (never both 0 and 1!)
    const activeAt1310 = findActiveWordIndexAtTime(mockWords, 1310);
    expect([0, 1]).toContain(activeAt1310);
    expect(findActiveWordIndexAtTime(mockWords, 1150)).toBe(0);
    expect(findActiveWordIndexAtTime(mockWords, 1450)).toBe(1);
  });

  it('prevents domino cascade when 1 identical-length LRC line is missed using acoustic F1/F2 phonetic fingerprinting', () => {
    const sr = 16000;
    const pcm = new Float32Array(sr * 14);
    const vowelSpec: Record<'A' | 'I' | 'U' | 'E', [number, number]> = {
      A: [760, 1480],
      I: [340, 2320],
      U: [340, 960],
      E: [580, 2050],
    };

    const writeSyllableBurst = (startMs: number, durMs: number, vowel: 'A' | 'I' | 'U' | 'E', amp = 0.28) => {
      const [f1, f2] = vowelSpec[vowel];
      const s0 = Math.floor((startMs / 1000) * sr);
      const len = Math.floor((durMs / 1000) * sr);
      for (let i = 0; i < len && s0 + i < pcm.length; i++) {
        const u = i / len;
        const env = Math.sin(Math.PI * u);
        const t = i / sr;
        pcm[s0 + i] +=
          amp *
          env *
          env *
          (0.62 * Math.sin(2 * Math.PI * f1 * t) + 0.35 * Math.sin(2 * Math.PI * f2 * t));
      }
    };

    // Audio has 5 phrases, ALL with 4 equal NoteBars & equal durations (~1.3s),
    // singing vowels [A, E, U, I, A] at 1s, 3.5s, 6s, 8.5s, 11s:
    const starts = [1000, 3500, 6000, 8500, 11000];
    const sungVowels: Array<'A' | 'I' | 'U' | 'E'> = ['A', 'E', 'U', 'I', 'A'];
    const bars: IVocalNoteBar[] = [];
    const phrases: IVocalPhrase[] = [];

    starts.forEach((s, pIdx) => {
      for (let b = 0; b < 4; b++) {
        const bs = s + b * 320;
        writeSyllableBurst(bs, 240, sungVowels[pIdx]);
        bars.push({
          id: `ph-bar-${pIdx}-${b}`,
          startTimeMs: bs,
          endTimeMs: bs + 240,
          durationMs: 240,
          midi: 62,
          exactMidi: 62,
          noteName: 'D4',
          solfegeName: 'Rê 4',
          avgCentsDiff: 0,
          pointsCount: 10,
        });
      }
      phrases.push({
        id: `ph-p-${pIdx}`,
        phraseIndex: pIdx + 1,
        startMs: s,
        endMs: s + 1200,
        durationMs: 1200,
        notes: ['D4'],
        lowestNote: 'D4',
        highestNote: 'D4',
        avgPitchHz: 293.66,
        avgMidi: 62,
        pitchJumpSemitones: 0,
        difficulty: 'Dễ',
        difficultyScore: 3,
        pointsCount: 32,
      });
    });

    // LRC has 6 lines ALL with 4 words! Line 2 ('A la ca ma') was missed/skipped by singer;
    // Lines 3..5 correspond to audio phrases 2, 3, 4 (Line 3 timestamp is shifted +1.1s so clock overlaps)!
    const cascadeLrcLines: ILrcLine[] = [
      { timeMs: 1000, text: 'Anh ba xa la' }, // Phrase 0 (A)
      { timeMs: 3500, text: 'Em bên lề đêm' }, // Phrase 1 (E)
      { timeMs: 5800, text: 'A la ca ma' }, // MISSED LINE (vowel A, placed near Phrase 2 = U!)
      { timeMs: 7100, text: 'Thu u bu du' }, // Phrase 2 (U) - shifted +1.1s
      { timeMs: 9300, text: 'I đi chi vi' }, // Phrase 3 (I) - shifted +0.8s
      { timeMs: 11000, text: 'Anh ca la ma' }, // Phrase 4 (A)
    ];

    alignLrcLinesToPhrases(phrases, bars, cascadeLrcLines, pcm, sr, [], 14000);
    expect(phrases.length).toBe(5);
    expect(phrases[0].lyricText).toBe('Anh ba xa la');
    expect(phrases[1].lyricText).toBe('Em bên lề đêm');
    expect(phrases[2].lyricText).toBe('Thu u bu du');
    expect(phrases[3].lyricText).toBe('I đi chi vi');
    expect(phrases[4].lyricText).toBe('Anh ca la ma');
  });

  it('skips 1 missed phrase in plain text (L > P) via phonetic Symmetric DP instead of cascading neighbors', () => {
    const sr = 16000;
    const pcm = new Float32Array(sr * 12);
    const writeVowelBurst = (startMs: number, durMs: number, f1: number, f2: number) => {
      const s0 = Math.floor((startMs / 1000) * sr);
      const len = Math.floor((durMs / 1000) * sr);
      for (let i = 0; i < len && s0 + i < pcm.length; i++) {
        const env = Math.sin(Math.PI * (i / len));
        const t = i / sr;
        pcm[s0 + i] += 0.25 * env * env * (0.62 * Math.sin(2 * Math.PI * f1 * t) + 0.35 * Math.sin(2 * Math.PI * f2 * t));
      }
    };

    // Audio phrases [A, I, U, E] at 1s, 3.5s, 6s, 8.5s (each 4 bars ~1200ms)
    const starts = [1000, 3500, 6000, 8500];
    const formants: Array<[number, number]> = [
      [760, 1480], // A
      [340, 2320], // I
      [340, 960],  // U
      [580, 2050], // E
    ];
    const bars: IVocalNoteBar[] = [];
    const phrases: IVocalPhrase[] = starts.map((s, pIdx) => {
      for (let b = 0; b < 4; b++) {
        const bs = s + b * 300;
        writeVowelBurst(bs, 220, formants[pIdx][0], formants[pIdx][1]);
        bars.push({
          id: `pt-skip-${pIdx}-${b}`,
          startTimeMs: bs,
          endTimeMs: bs + 220,
          durationMs: 220,
          midi: 60,
          exactMidi: 60,
          noteName: 'C4',
          solfegeName: 'Đô 4',
          avgCentsDiff: 0,
          pointsCount: 10,
        });
      }
      return {
        id: `pt-skip-p-${pIdx}`,
        phraseIndex: pIdx + 1,
        startMs: s,
        endMs: s + 1120,
        durationMs: 1120,
        notes: ['C4'],
        lowestNote: 'C4',
        highestNote: 'C4',
        avgPitchHz: 261.6,
        avgMidi: 60,
        pitchJumpSemitones: 0,
        difficulty: 'Dễ',
        difficultyScore: 3,
        pointsCount: 30,
      };
    });

    // Plain lyrics has 5 lines where line 2 ('Xa ta ba la' = A) was missed between I and U
    const plain = [
      'Anh ca ba xa',
      'Khi mi đi chi',
      'Xa ta ba la',
      'Thu u du bu',
      'Đêm em lên thềm',
    ].join('\n');

    alignPlainTextToPhrases(phrases, bars, plain, pcm, sr, []);
    expect(phrases.length).toBe(4);
    expect(phrases[0].lyricText).toBe('Anh ca ba xa');
    expect(phrases[1].lyricText).toBe('Khi mi đi chi');
    expect(phrases[2].lyricText).toBe('Thu u du bu');
    expect(phrases[3].lyricText).toBe('Đêm em lên thềm');
  });

  it('extracts true acoustic syllable count on single fused legato/rap NoteBar so dense lines stay anchored', () => {
    const sr = 16000;
    const pcm = new Float32Array(sr * 3);
    // Synthesize 7 crisp modulated vocal syllable peaks inside 1 single fused NoteBar (400ms..2500ms)
    for (let k = 0; k < 7; k++) {
      const s0 = Math.floor(((400 + k * 280) / 1000) * sr);
      const len = Math.floor(0.18 * sr);
      for (let i = 0; i < len && s0 + i < pcm.length; i++) {
        const env = Math.sin(Math.PI * (i / len));
        const t = i / sr;
        pcm[s0 + i] += 0.25 * env * env * (0.6 * Math.sin(2 * Math.PI * 720 * t) + 0.35 * Math.sin(2 * Math.PI * 1500 * t));
      }
    }

    const fusedBar: IVocalNoteBar = {
      id: 'fused-rap-bar',
      startTimeMs: 400,
      endTimeMs: 2450,
      durationMs: 2050,
      midi: 60,
      exactMidi: 60,
      noteName: 'C4',
      solfegeName: 'Đô 4',
      avgCentsDiff: 0,
      pointsCount: 60,
    };

    const profile = profileAudioClusterPhonetics({
      bars: [fusedBar],
      startMs: 400,
      endMs: 2450,
      rawMonoPcm: pcm,
      sampleRate: sr,
    });

    expect(profile.hasUsableAudio).toBe(true);
    expect(profile.acousticSyllableCount).toBeGreaterThanOrEqual(6);
  });

  it('rescues unvoiced/soft-rap spoken phrases in inter-phrase gaps while ignoring 78Hz sub-bass rumble', () => {
    const sr = 16000;
    const durSec = 7;
    const rawPcm = new Float32Array(sr * durSec);
    const filteredPcm = new Float32Array(sr * durSec);

    // Gap inside 1.5s..5.5s contains:
    // A) 4-syllable spoken/rap burst at 2.1s..3.4s (mid vocal bands 480Hz + 920Hz + 1650Hz)
    for (let k = 0; k < 4; k++) {
      const s0 = Math.floor(((2100 + k * 300) / 1000) * sr);
      const len = Math.floor(0.2 * sr);
      for (let i = 0; i < len; i++) {
        const env = Math.sin(Math.PI * (i / len));
        const t = i / sr;
        const val =
          0.26 *
          env *
          env *
          (0.45 * Math.sin(2 * Math.PI * 520 * t) +
            0.35 * Math.sin(2 * Math.PI * 960 * t) +
            0.2 * Math.sin(2 * Math.PI * 1650 * t));
        rawPcm[s0 + i] += val;
        filteredPcm[s0 + i] += val;
      }
    }

    // B) Pure 78Hz sub-bass thump at 4.3s..4.95s (must NOT be rescued as a vocal phrase)
    {
      const s0 = Math.floor(4.3 * sr);
      const len = Math.floor(0.65 * sr);
      for (let i = 0; i < len; i++) {
        const val = 0.22 * Math.sin(2 * Math.PI * 78 * (i / sr));
        rawPcm[s0 + i] += val;
        filteredPcm[s0 + i] += val * 0.4;
      }
    }

    const noteBars: IVocalNoteBar[] = [
      { id: 'orig-1', startTimeMs: 400, endTimeMs: 1300, durationMs: 900, midi: 60, exactMidi: 60, noteName: 'C4', solfegeName: 'Đô 4', avgCentsDiff: 0, pointsCount: 25 },
      { id: 'orig-2', startTimeMs: 5600, endTimeMs: 6500, durationMs: 900, midi: 64, exactMidi: 64, noteName: 'E4', solfegeName: 'Mi 4', avgCentsDiff: 0, pointsCount: 25 },
    ];
    const phrases: IVocalPhrase[] = [
      { id: 'p-a', phraseIndex: 1, startMs: 400, endMs: 1300, durationMs: 900, notes: ['C4'], lowestNote: 'C4', highestNote: 'C4', avgPitchHz: 261.6, avgMidi: 60, pitchJumpSemitones: 0, difficulty: 'Dễ', difficultyScore: 3, pointsCount: 25 },
      { id: 'p-b', phraseIndex: 2, startMs: 5600, endMs: 6500, durationMs: 900, notes: ['E4'], lowestNote: 'E4', highestNote: 'E4', avgPitchHz: 329.6, avgMidi: 64, pitchJumpSemitones: 0, difficulty: 'Dễ', difficultyScore: 3, pointsCount: 25 },
    ];

    const rescued = rescueUnvoicedVocalPhrasesFromPcm({
      rawMonoPcm: rawPcm,
      filteredPcm,
      sampleRate: sr,
      durationMs: durSec * 1000,
      noiseFloorRms: 0.005,
      pitchTrack: [],
      noteBars,
      phrases,
      lowestMidi: 60,
      highestMidi: 64,
      createMidiNoteInfo: () => ({ noteName: 'D4', solfegeName: 'Rê 4' }),
    });

    expect(rescued).toBe(1);
    expect(phrases.length).toBe(3);
    expect(phrases[1].startMs).toBeGreaterThanOrEqual(2000);
    expect(phrases[1].endMs).toBeLessThanOrEqual(3550);
    expect(noteBars.length).toBeGreaterThanOrEqual(4);
  });

  it('builds phonetic cluster profiles asynchronously with progress callbacks', async () => {
    const sr = 16000;
    const pcm = new Float32Array(sr * 12);
    const clusters: Array<{ bars: IVocalNoteBar[]; startMs: number; endMs: number }> = [];
    for (let i = 0; i < 10; i++) {
      const startMs = i * 1000 + 100;
      const s0 = Math.floor((startMs / 1000) * sr);
      for (let j = 0; j < Math.floor(0.4 * sr); j++) {
        pcm[s0 + j] = 0.2 * Math.sin(2 * Math.PI * 730 * (j / sr));
      }
      clusters.push({
        startMs,
        endMs: startMs + 400,
        bars: [
          {
            id: `async-b-${i}`,
            startTimeMs: startMs,
            endTimeMs: startMs + 400,
            durationMs: 400,
            midi: 60,
            exactMidi: 60,
            noteName: 'C4',
            solfegeName: 'Đô 4',
            avgCentsDiff: 0,
            pointsCount: 10,
          },
        ],
      });
    }

    const progressUpdates: number[] = [];
    const map = await buildClusterPhoneticProfilesAsync({
      clusters,
      rawMonoPcm: pcm,
      sampleRate: sr,
      onProgress: (pct) => progressUpdates.push(pct),
    });

    expect(map.size).toBe(10);
    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(97);

    // Indexed lookup resolves arbitrary sub-windows in O(log S) without PCM re-scan
    const index = buildPhoneticSyllableIndex(map);
    expect(index.hasUsableAudio).toBe(true);
    const subProfile = queryIndexedClusterProfile(index, 2000, 5600, 4);
    expect(subProfile.hasUsableAudio).toBe(true);
    expect(subProfile.syllables.length).toBeGreaterThanOrEqual(3);
  });
});
