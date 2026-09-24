import { Note, Interval, Scale, Chord } from 'tonal';

export interface IIntervalInfo {
  code: string;       // e.g. '3M'
  nameVi: string;     // e.g. 'Quãng 3 Trưởng'
  nameEn: string;     // e.g. 'Major 3rd'
  semitones: number;  // 4
  ratioDescription: string; // 'Tươi sáng, hoan ca'
  inversionCode: string;    // '6m'
}

export const INTERVAL_CATALOG: Record<string, IIntervalInfo> = {
  '1P': { code: '1P', nameVi: 'Quãng 1 Đúng (Đồng âm)', nameEn: 'Perfect Unison', semitones: 0, ratioDescription: 'Trùng cao độ tuyệt đối (1:1)', inversionCode: '8P' },
  '2m': { code: '2m', nameVi: 'Quãng 2 Thứ', nameEn: 'Minor 2nd', semitones: 1, ratioDescription: 'Nghịch chát, cọ xát căng thẳng', inversionCode: '7M' },
  '2M': { code: '2M', nameVi: 'Quãng 2 Trưởng', nameEn: 'Major 2nd', semitones: 2, ratioDescription: 'Bước đi liền bậc, bước sóng nhẹ', inversionCode: '7m' },
  '3m': { code: '3m', nameVi: 'Quãng 3 Thứ', nameEn: 'Minor 3rd', semitones: 3, ratioDescription: 'U buồn, lắng đọng, trữ tình', inversionCode: '6M' },
  '3M': { code: '3M', nameVi: 'Quãng 3 Trưởng', nameEn: 'Major 3rd', semitones: 4, ratioDescription: 'Trong sáng, rạng rỡ, hoan ca', inversionCode: '6m' },
  '4P': { code: '4P', nameVi: 'Quãng 4 Đúng', nameEn: 'Perfect 4th', semitones: 5, ratioDescription: 'Vững chãi, kêu gọi, mở đầu', inversionCode: '5P' },
  '4A': { code: '4A', nameVi: 'Quãng 4 Tăng (Tritone)', nameEn: 'Augmented 4th / Tritone', semitones: 6, ratioDescription: 'Bất an, ma mị, căng thẳng tột độ (Diabolus in Musica)', inversionCode: '5d' },
  '5d': { code: '5d', nameVi: 'Quãng 5 Giảm (Tritone)', nameEn: 'Diminished 5th', semitones: 6, ratioDescription: 'Bất an, ma mị, cần giải tỏa hòa âm', inversionCode: '4A' },
  '5P': { code: '5P', nameVi: 'Quãng 5 Đúng', nameEn: 'Perfect 5th', semitones: 7, ratioDescription: 'Hùng tráng, mở rộng, không gian vũ trụ', inversionCode: '4P' },
  '6m': { code: '6m', nameVi: 'Quãng 6 Thứ', nameEn: 'Minor 6th', semitones: 8, ratioDescription: 'Da diết, hoài niệm, lãng mạn sâu lắng', inversionCode: '3M' },
  '6M': { code: '6M', nameVi: 'Quãng 6 Trưởng', nameEn: 'Major 6th', semitones: 9, ratioDescription: 'Ấm áp, êm đềm, du dương', inversionCode: '3m' },
  '7m': { code: '7m', nameVi: 'Quãng 7 Thứ', nameEn: 'Minor 7th', semitones: 10, ratioDescription: 'Màu sắc Blues/Jazz, hướng ngoại mở', inversionCode: '2M' },
  '7M': { code: '7M', nameVi: 'Quãng 7 Trưởng', nameEn: 'Major 7th', semitones: 11, ratioDescription: 'Lung linh mơ màng, hoài vọng', inversionCode: '2m' },
  '8P': { code: '8P', nameVi: 'Quãng 8 Đúng (Bát độ)', nameEn: 'Perfect Octave', semitones: 12, ratioDescription: 'Đồng âm cách một quãng tám (2:1)', inversionCode: '1P' },
};

export interface IChordTypeInfo {
  type: string;           // 'Major', 'Minor', 'dom7', etc.
  nameVi: string;
  nameEn: string;
  formula: string[];      // ['1P', '3M', '5P']
  feelDescription: string;
  symbolSuffix: string;
}

export const CHORD_TYPE_CATALOG: Record<string, IChordTypeInfo> = {
  'Major': { type: 'Major', nameVi: 'Hợp âm Trưởng', nameEn: 'Major Triad', formula: ['1P', '3M', '5P'], feelDescription: 'Vui tươi, sáng sủa, ổn định', symbolSuffix: '' },
  'Minor': { type: 'Minor', nameVi: 'Hợp âm Thứ', nameEn: 'Minor Triad', formula: ['1P', '3m', '5P'], feelDescription: 'Buồn, êm dịu, nội tâm', symbolSuffix: 'm' },
  'Diminished': { type: 'Diminished', nameVi: 'Hợp âm Giảm', nameEn: 'Diminished Triad', formula: ['1P', '3m', '5d'], feelDescription: 'Căng thẳng, tối tăm, kịch tính', symbolSuffix: 'dim' },
  'Augmented': { type: 'Augmented', nameVi: 'Hợp âm Tăng', nameEn: 'Augmented Triad', formula: ['1P', '3M', '5A'], feelDescription: 'Lơ lửng, huyền bí, kỳ ảo', symbolSuffix: 'aug' },
  'Maj7': { type: 'Maj7', nameVi: 'Trưởng 7 (Major 7th)', nameEn: 'Major 7th', formula: ['1P', '3M', '5P', '7M'], feelDescription: 'Mơ màng, lãng mạn, jazz ấm áp', symbolSuffix: 'maj7' },
  'm7': { type: 'm7', nameVi: 'Thứ 7 (Minor 7th)', nameEn: 'Minor 7th', formula: ['1P', '3m', '5P', '7m'], feelDescription: 'Sâu lắng, thư thái, neo-soul', symbolSuffix: 'm7' },
  'dom7': { type: 'dom7', nameVi: 'Át 7 (Dominant 7th)', nameEn: 'Dominant 7th', formula: ['1P', '3M', '5P', '7m'], feelDescription: 'Kêu gọi hút về chủ âm, bluesy', symbolSuffix: '7' },
  'm7b5': { type: 'm7b5', nameVi: 'Nửa Giảm (Half-Diminished 7th)', nameEn: 'Half-Diminished 7th', formula: ['1P', '3m', '5d', '7m'], feelDescription: 'Dằn vặt, bí ẩn, jazz noir', symbolSuffix: 'm7b5' },
  'dim7': { type: 'dim7', nameVi: 'Giảm 7 (Diminished 7th)', nameEn: 'Full Diminished 7th', formula: ['1P', '3m', '5d', '6M'], feelDescription: 'Kinh dị, nghẹt thở, đột biến', symbolSuffix: 'dim7' },
  'sus2': { type: 'sus2', nameVi: 'Treo 2 (Suspended 2nd)', nameEn: 'Suspended 2nd', formula: ['1P', '2M', '5P'], feelDescription: 'Trong trẻo, rộng mở, hiện đại', symbolSuffix: 'sus2' },
  'sus4': { type: 'sus4', nameVi: 'Treo 4 (Suspended 4th)', nameEn: 'Suspended 4th', formula: ['1P', '4P', '5P'], feelDescription: 'Chờ đợi, háo hức, chưa hồi kết', symbolSuffix: 'sus4' },
  '9th': { type: '9th', nameVi: 'Hợp âm 9 (Dominant 9th)', nameEn: 'Dominant 9th', formula: ['1P', '3M', '5P', '7m', '9M'], feelDescription: 'Sang trọng, rực rỡ, funk/jazz', symbolSuffix: '9' }
};

export const PIANO_KEYS_88 = [
  // C4 to B4
  { note: 'C4', isBlack: false, freq: 261.63 },
  { note: 'C#4', isBlack: true, freq: 277.18 },
  { note: 'D4', isBlack: false, freq: 293.66 },
  { note: 'D#4', isBlack: true, freq: 311.13 },
  { note: 'E4', isBlack: false, freq: 329.63 },
  { note: 'F4', isBlack: false, freq: 349.23 },
  { note: 'F#4', isBlack: true, freq: 369.99 },
  { note: 'G4', isBlack: false, freq: 392.00 },
  { note: 'G#4', isBlack: true, freq: 415.30 },
  { note: 'A4', isBlack: false, freq: 440.00 },
  { note: 'A#4', isBlack: true, freq: 466.16 },
  { note: 'B4', isBlack: false, freq: 493.88 },
  // C5 to B5
  { note: 'C5', isBlack: false, freq: 523.25 },
  { note: 'C#5', isBlack: true, freq: 554.37 },
  { note: 'D5', isBlack: false, freq: 587.33 },
  { note: 'D#5', isBlack: true, freq: 622.25 },
  { note: 'E5', isBlack: false, freq: 659.25 },
  { note: 'F5', isBlack: false, freq: 698.46 },
  { note: 'F#5', isBlack: true, freq: 739.99 },
  { note: 'G5', isBlack: false, freq: 783.99 },
  { note: 'G#5', isBlack: true, freq: 830.61 },
  { note: 'A5', isBlack: false, freq: 880.00 },
  { note: 'A#5', isBlack: true, freq: 932.33 },
  { note: 'B5', isBlack: false, freq: 987.77 },
];

export const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Get accurate frequency for any scientific pitch notation note (e.g. 'A4' -> 440, 'C4' -> 261.63)
 */
export function getNoteFrequency(noteName: string): number {
  const f = Note.freq(noteName);
  return f || 440.0;
}

/**
 * Transpose a note by an interval (e.g., transposeNote('C4', '3M') -> 'E4')
 */
export function transposeNote(noteName: string, intervalCode: string): string {
  return Note.transpose(noteName, intervalCode);
}

/**
 * Calculate interval between two notes (e.g., 'C4' and 'G4' -> '5P')
 */
export function getIntervalBetween(noteA: string, noteB: string): string {
  const dist = Interval.distance(noteA, noteB);
  return dist || '1P';
}

/**
 * Generate a random note in specified octaves (default 4)
 */
export function getRandomNote(octaves: number[] = [4], includeAccidentals = false): string {
  const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pool = includeAccidentals ? allNotes : naturalNotes;
  const note = pool[Math.floor(Math.random() * pool.length)];
  const oct = octaves[Math.floor(Math.random() * octaves.length)];
  return `${note}${oct}`;
}

/**
 * Generate a sequence of random notes with constraints
 */
export function generateRandomPitchSequence(
  length: number,
  octaves: number[] = [4],
  accidentals = false,
  noImmediateRepeats = true
): string[] {
  const result: string[] = [];
  let lastNote = '';
  for (let i = 0; i < length; i++) {
    let nextNote = '';
    let attempts = 0;
    do {
      nextNote = getRandomNote(octaves, accidentals);
      attempts++;
    } while (noImmediateRepeats && nextNote === lastNote && attempts < 10);
    result.push(nextNote);
    lastNote = nextNote;
  }
  return result;
}

/**
 * Generate an interval challenge: root note, target note, and question options
 */
export function generateIntervalQuestion(
  intervalPool: string[],
  direction: 'ascending' | 'descending' | 'harmonic' | 'mixed' = 'mixed',
  optionsCount = 4
): {
  rootNote: string;
  targetNote: string;
  intervalCode: string;
  intervalInfo: IIntervalInfo;
  playbackDirection: 'ascending' | 'descending' | 'harmonic';
  options: IIntervalInfo[];
} {
  const chosenIntervalCode = intervalPool[Math.floor(Math.random() * intervalPool.length)] || '5P';
  const info = INTERVAL_CATALOG[chosenIntervalCode] || INTERVAL_CATALOG['5P'];

  // Pick root note around C4 to G4
  const roots = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B3'];
  const rootNote = roots[Math.floor(Math.random() * roots.length)];

  let playbackDirection: 'ascending' | 'descending' | 'harmonic' = 'ascending';
  if (direction === 'mixed') {
    const modes: Array<'ascending' | 'descending' | 'harmonic'> = ['ascending', 'descending', 'harmonic'];
    playbackDirection = modes[Math.floor(Math.random() * modes.length)];
  } else {
    playbackDirection = direction;
  }

  let targetNote = '';
  if (playbackDirection === 'descending') {
    // Transpose downwards
    const invertedInterval = '-' + chosenIntervalCode;
    targetNote = Note.transpose(rootNote, invertedInterval);
  } else {
    targetNote = Note.transpose(rootNote, chosenIntervalCode);
  }

  // Create distractor options
  const allAvailable = Object.values(INTERVAL_CATALOG).filter(i => i.code !== chosenIntervalCode);
  // Shuffle distractors
  const shuffledDistractors = [...allAvailable].sort(() => 0.5 - Math.random());
  const options = [info, ...shuffledDistractors.slice(0, optionsCount - 1)].sort(() => 0.5 - Math.random());

  return {
    rootNote,
    targetNote,
    intervalCode: chosenIntervalCode,
    intervalInfo: info,
    playbackDirection,
    options
  };
}

/**
 * Generate a Chord Question with notes and distractor chord types
 */
export function generateChordQuestion(
  allowedTypes: string[] = ['Major', 'Minor'],
  rootNotesPool: string[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
  optionsCount = 4
): {
  rootNote: string;
  chordType: string;
  chordName: string;
  notes: string[];
  typeInfo: IChordTypeInfo;
  options: IChordTypeInfo[];
} {
  const chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)] || 'Major';
  const typeInfo = CHORD_TYPE_CATALOG[chosenType] || CHORD_TYPE_CATALOG['Major'];
  const root = rootNotesPool[Math.floor(Math.random() * rootNotesPool.length)];

  // Build notes
  const notes = typeInfo.formula.map(interval => Note.transpose(root, interval));
  const chordName = `${root.replace(/\d/, '')}${typeInfo.symbolSuffix}`;

  // Distractors
  const otherTypes = Object.values(CHORD_TYPE_CATALOG).filter(c => c.type !== chosenType);
  const shuffledOther = [...otherTypes].sort(() => 0.5 - Math.random());
  const options = [typeInfo, ...shuffledOther.slice(0, optionsCount - 1)].sort(() => 0.5 - Math.random());

  return {
    rootNote: root,
    chordType: chosenType,
    chordName,
    notes,
    typeInfo,
    options
  };
}

/**
 * Generate Euclidean Rhythm using Bjorklund's algorithm
 * e.g., pulses=5, steps=16 -> [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false]
 */
export function generateEuclideanRhythm(pulses: number, steps: number): boolean[] {
  if (pulses <= 0) return new Array(steps).fill(false);
  if (pulses >= steps) return new Array(steps).fill(true);

  let pattern: boolean[][] = [];
  for (let i = 0; i < steps; i++) {
    pattern.push([i < pulses]);
  }

  let countZero = steps - pulses;
  let countOne = pulses;

  while (countZero > 1 && countOne > 1) {
    const minVal = Math.min(countOne, countZero);
    for (let i = 0; i < minVal; i++) {
      pattern[i] = pattern[i].concat(pattern[pattern.length - 1 - i]);
    }
    pattern = pattern.slice(0, pattern.length - minVal);
    if (countOne > countZero) {
      countOne -= countZero;
    } else {
      countZero -= countOne;
    }
  }

  // Flatten
  return pattern.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Generate rhythm pattern for the Rhythm Recall game
 */
export interface IRhythmStep {
  stepIndex: number;
  timeMs: number;
  isHit: boolean;
  isAccent?: boolean;
  timbre?: 'kick' | 'snare' | 'hihat' | 'tom';
}

export function generateRhythmPattern(
  totalSteps: number,
  bpm: number,
  density: number = 0.5, // 0.3 to 0.7
  options?: {
    syncopated?: boolean;
    accents?: boolean;
    swing?: boolean;
    multiDrum?: boolean;
  }
): {
  steps: IRhythmStep[];
  stepIntervalMs: number;
  totalDurationMs: number;
  bpm: number;
} {
  const stepIntervalMs = Math.round((60000 / bpm) / 2); // 8th notes
  const steps: IRhythmStep[] = [];

  // Generate hits
  for (let i = 0; i < totalSteps; i++) {
    const isFirstBeat = i % 4 === 0;
    const isOffbeat = i % 2 !== 0;

    let hitProbability = density;
    if (isFirstBeat) hitProbability = 0.95; // Downbeats usually have hits
    else if (options?.syncopated && isOffbeat) hitProbability = Math.min(0.85, density + 0.3);

    const isHit = Math.random() < hitProbability;
    const isAccent = isHit && (isFirstBeat || (options?.accents && Math.random() < 0.3));

    let timbre: 'kick' | 'snare' | 'hihat' | 'tom' = 'snare';
    if (options?.multiDrum) {
      if (isFirstBeat) timbre = 'kick';
      else if (i % 4 === 2) timbre = 'snare';
      else if (isOffbeat) timbre = 'hihat';
      else timbre = 'tom';
    }

    // Apply swing offset if requested
    let timeOffsetMs = i * stepIntervalMs;
    if (options?.swing && isOffbeat) {
      timeOffsetMs += Math.round(stepIntervalMs * 0.25);
    }

    steps.push({
      stepIndex: i,
      timeMs: timeOffsetMs,
      isHit,
      isAccent,
      timbre
    });
  }

  // Ensure at least 3 hits
  const hitCount = steps.filter(s => s.isHit).length;
  if (hitCount < 3) {
    steps[0].isHit = true;
    steps[2].isHit = true;
    steps[4].isHit = true;
  }

  const totalDurationMs = totalSteps * stepIntervalMs + 400;

  return {
    steps,
    stepIntervalMs,
    totalDurationMs,
    bpm
  };
}
