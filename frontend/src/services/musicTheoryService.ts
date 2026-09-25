import { Note, Interval, Scale, Chord } from 'tonal';

export interface IIntervalInfo {
  code: string;       // e.g. '3M'
  nameVi: string;     // e.g. 'Quãng 3 Trưởng'
  nameEn: string;     // e.g. 'Major 3rd'
  semitones: number;  // 4
  ratioDescription: string; // 'Tươi sáng, hoan ca'
  inversionCode: string;    // '6m'
  mnemonicSongVi?: string;  // Bài hát quen thuộc để gợi nhớ
  tipVi?: string;           // Lời khuyên nhận diện bằng trực giác thính giác
}

export const INTERVAL_CATALOG: Record<string, IIntervalInfo> = {
  '1P': { 
    code: '1P', 
    nameVi: 'Quãng 1 Đúng (Đồng âm)', 
    nameEn: 'Perfect Unison', 
    semitones: 0, 
    ratioDescription: 'Trùng cao độ tuyệt đối (1:1)', 
    inversionCode: '8P',
    mnemonicSongVi: 'Hai nốt cùng vang một cao độ',
    tipVi: 'Âm thanh hoàn toàn đồng nhất, không có chênh lệch cao độ.'
  },
  '2m': { 
    code: '2m', 
    nameVi: 'Quãng 2 Thứ', 
    nameEn: 'Minor 2nd', 
    semitones: 1, 
    ratioDescription: 'Nghịch chát, cọ xát căng thẳng', 
    inversionCode: '7M',
    mnemonicSongVi: 'Nhạc phim Hàm cá mập (Jaws), Für Elise (2 nốt đầu)',
    tipVi: '2 nốt nằm sát nhau nhất (nửa cung), cọ xát kịch tính và căng thẳng tột độ.'
  },
  '2M': { 
    code: '2M', 
    nameVi: 'Quãng 2 Trưởng', 
    nameEn: 'Major 2nd', 
    semitones: 2, 
    ratioDescription: 'Bước đi liền bậc, bước sóng nhẹ', 
    inversionCode: '7m',
    mnemonicSongVi: 'Happy Birthday ("Háp-pi"), Đêm Thánh Vô Cùng (Silent Night)',
    tipVi: 'Bước đi liền bậc cơ bản nhất trong âm giai (1 cung = 2 phím đàn liền kề có phím đen ở giữa).'
  },
  '3m': { 
    code: '3m', 
    nameVi: 'Quãng 3 Thứ', 
    nameEn: 'Minor 3rd', 
    semitones: 3, 
    ratioDescription: 'U buồn, lắng đọng, trữ tình', 
    inversionCode: '6M',
    mnemonicSongVi: 'Greensleeves (2 nốt đầu), Bài hát ru Lullaby (Brahms)',
    tipVi: 'Cốt lõi tạo nên hợp âm Thứ và điệu thức Thứ, mang màu sắc nội tâm, trầm buồn lắng đọng.'
  },
  '3M': { 
    code: '3M', 
    nameVi: 'Quãng 3 Trưởng', 
    nameEn: 'Major 3rd', 
    semitones: 4, 
    ratioDescription: 'Trong sáng, rạng rỡ, hoan ca', 
    inversionCode: '6m',
    mnemonicSongVi: 'Kìa con bướm vàng ("Kìa-con"), Tiếng chuông Big Ben',
    tipVi: 'Cốt lõi của điệu thức Trưởng, tạo cảm giác vô cùng tươi sáng, tràn đầy hy vọng và nụ cười.'
  },
  '4P': { 
    code: '4P', 
    nameVi: 'Quãng 4 Đúng', 
    nameEn: 'Perfect 4th', 
    semitones: 5, 
    ratioDescription: 'Vững chãi, kêu gọi, mở đầu', 
    inversionCode: '5P',
    mnemonicSongVi: 'Tiến quân ca ("Đoàn-quân"), Amazing Grace, Hành khúc đám cưới',
    tipVi: 'Âm thanh vững chãi, uy nghiêm như một lời hiệu triệu, mở đầu cho nhiều bản hành khúc.'
  },
  '4A': { 
    code: '4A', 
    nameVi: 'Quãng 4 Tăng (Tritone)', 
    nameEn: 'Augmented 4th / Tritone', 
    semitones: 6, 
    ratioDescription: 'Bất an, ma mị, căng thẳng tột độ (Diabolus in Musica)', 
    inversionCode: '5d',
    mnemonicSongVi: 'The Simpsons (Chủ đề phim: "The-Simp..."), Maria (West Side Story)',
    tipVi: 'Chia đôi quãng 8 (đúng 3 cung), cực kỳ bất an và ma mị, đòi hỏi phải giải tỏa về quãng kề.'
  },
  '5d': { 
    code: '5d', 
    nameVi: 'Quãng 5 Giảm (Tritone)', 
    nameEn: 'Diminished 5th', 
    semitones: 6, 
    ratioDescription: 'Bất an, ma mị, cần giải tỏa hòa âm', 
    inversionCode: '4A',
    mnemonicSongVi: 'Cùng số bán âm với 4A (Tritone ma quỷ)',
    tipVi: 'Chính là quãng tritone nhưng ghi theo tên nốt giảm, âm sắc hồi hộp, bí ẩn và căng thẳng.'
  },
  '5P': { 
    code: '5P', 
    nameVi: 'Quãng 5 Đúng', 
    nameEn: 'Perfect 5th', 
    semitones: 7, 
    ratioDescription: 'Hùng tráng, mở rộng, không gian vũ trụ', 
    inversionCode: '4P',
    mnemonicSongVi: 'Star Wars (Theme hùng tráng), Twinkle Twinkle Little Star',
    tipVi: 'Quãng thuận tuyệt đối (tỉ lệ 3:2), mang lại cảm giác bao la, hùng vĩ và cân bằng hoàn hảo.'
  },
  '6m': { 
    code: '6m', 
    nameVi: 'Quãng 6 Thứ', 
    nameEn: 'Minor 6th', 
    semitones: 8, 
    ratioDescription: 'Da diết, hoài niệm, lãng mạn sâu lắng', 
    inversionCode: '3M',
    mnemonicSongVi: 'The Entertainer, Nhạc tình ca hoài niệm lãng mạn',
    tipVi: 'Là nghịch đảo của quãng 3 Trưởng, mang màu sắc da diết, chất chứa nhiều xúc cảm nghẹn ngào.'
  },
  '6M': { 
    code: '6M', 
    nameVi: 'Quãng 6 Trưởng', 
    nameEn: 'Major 6th', 
    semitones: 9, 
    ratioDescription: 'Ấm áp, êm đềm, du dương', 
    inversionCode: '3m',
    mnemonicSongVi: 'Jingle Bells ("Dash-ing through the snow"), My Bonnie Lies Over the Ocean',
    tipVi: 'Quãng thuận êm dịu, ấm áp, rực rỡ và thân quen trong các khúc hát dân ca.'
  },
  '7m': { 
    code: '7m', 
    nameVi: 'Quãng 7 Thứ', 
    nameEn: 'Minor 7th', 
    semitones: 10, 
    ratioDescription: 'Màu sắc Blues/Jazz, hướng ngoại mở', 
    inversionCode: '2M',
    mnemonicSongVi: 'Somewhere ("There\'s a place for us" - West Side Story), Star Trek Theme',
    tipVi: 'Màu sắc jazz và blues phóng khoáng, cách quãng 8 đúng một cung (2 phím đàn).'
  },
  '7M': { 
    code: '7M', 
    nameVi: 'Quãng 7 Trưởng', 
    nameEn: 'Major 7th', 
    semitones: 11, 
    ratioDescription: 'Lung linh mơ màng, hoài vọng', 
    inversionCode: '2m',
    mnemonicSongVi: 'Take On Me (Điệp khúc: "Take-on"), Pure Imagination',
    tipVi: 'Cách quãng 8 đúng chỉ nửa cung, tạo lực hút mãnh liệt hướng lên nốt chủ âm octave.'
  },
  '8P': { 
    code: '8P', 
    nameVi: 'Quãng 8 Đúng (Bát độ)', 
    nameEn: 'Perfect Octave', 
    semitones: 12, 
    ratioDescription: 'Đồng âm cách một quãng tám (2:1)', 
    inversionCode: '1P',
    mnemonicSongVi: 'Somewhere Over the Rainbow ("Some-where..."), Let It Go',
    tipVi: 'Tần số gấp đôi chính xác (2:1), tai người cảm nhận là cùng một nốt nhưng ở tầng cao mới.'
  },
};

export interface IChordTypeInfo {
  type: string;           // 'Major', 'Minor', 'dom7', etc.
  nameVi: string;
  nameEn: string;
  formula: string[];      // ['1P', '3M', '5P']
  feelDescription: string;
  symbolSuffix: string;
  mnemonicVi?: string;
  tipVi?: string;
}

export const CHORD_TYPE_CATALOG: Record<string, IChordTypeInfo> = {
  'Major': { 
    type: 'Major', 
    nameVi: 'Hợp âm Trưởng', 
    nameEn: 'Major Triad', 
    formula: ['1P', '3M', '5P'], 
    feelDescription: 'Vui tươi, sáng sủa, ổn định', 
    symbolSuffix: '',
    mnemonicVi: 'Âm thanh tươi vui, sáng sủa và vững chãi (Do - Mi - Sol)',
    tipVi: 'Gồm quãng 3 Trưởng (4 nửa cung) ở dưới và quãng 3 Thứ ở trên. Cảm giác trọn vẹn, tích cực.'
  },
  'Minor': { 
    type: 'Minor', 
    nameVi: 'Hợp âm Thứ', 
    nameEn: 'Minor Triad', 
    formula: ['1P', '3m', '5P'], 
    feelDescription: 'Buồn, êm dịu, nội tâm', 
    symbolSuffix: 'm',
    mnemonicVi: 'Âm sắc u buồn, sâu lắng, trữ tình nội tâm (La - Do - Mi)',
    tipVi: 'Gồm quãng 3 Thứ (3 nửa cung) ở dưới. Nghe trầm lặng, dịu dàng hoặc u sầu.'
  },
  'Diminished': { 
    type: 'Diminished', 
    nameVi: 'Hợp âm Giảm', 
    nameEn: 'Diminished Triad', 
    formula: ['1P', '3m', '5d'], 
    feelDescription: 'Căng thẳng, tối tăm, kịch tính', 
    symbolSuffix: 'dim',
    mnemonicVi: 'Bất an, rùng rợn, hồi hộp như trong phim kinh dị',
    tipVi: '2 quãng 3 Thứ liên tiếp (3 + 3 nửa cung). Quãng 5 Giảm (tritone) làm âm thanh co rút, bất an.'
  },
  'Augmented': { 
    type: 'Augmented', 
    nameVi: 'Hợp âm Tăng', 
    nameEn: 'Augmented Triad', 
    formula: ['1P', '3M', '5A'], 
    feelDescription: 'Lơ lửng, huyền bí, kỳ ảo', 
    symbolSuffix: 'aug',
    mnemonicVi: 'Bay bổng, không gian viễn tưởng vũ trụ, huyền ảo',
    tipVi: '2 quãng 3 Trưởng liên tiếp (4 + 4 nửa cung). Bậc 5 bị thăng lên tạo cảm giác lơ lửng không đáy.'
  },
  'Maj7': { 
    type: 'Maj7', 
    nameVi: 'Trưởng 7 (Major 7th)', 
    nameEn: 'Major 7th', 
    formula: ['1P', '3M', '5P', '7M'], 
    feelDescription: 'Mơ màng, lãng mạn, jazz ấm áp', 
    symbolSuffix: 'maj7',
    mnemonicVi: 'Không gian quán cà phê Jazz, mơ màng, sang trọng',
    tipVi: 'Hợp âm Trưởng kết hợp thêm nốt bậc 7 Trưởng, tạo màu sắc lung linh quý phái.'
  },
  'm7': { 
    type: 'm7', 
    nameVi: 'Thứ 7 (Minor 7th)', 
    nameEn: 'Minor 7th', 
    formula: ['1P', '3m', '5P', '7m'], 
    feelDescription: 'Sâu lắng, thư thái, neo-soul', 
    symbolSuffix: 'm7',
    mnemonicVi: 'Nhạc Lofi chill, thư thái, êm ái chiều mưa',
    tipVi: 'Hợp âm Thứ kết hợp nốt bậc 7 Thứ, xoa dịu nỗi buồn và tăng cảm giác thư giãn hiện đại.'
  },
  'dom7': { 
    type: 'dom7', 
    nameVi: 'Át 7 (Dominant 7th)', 
    nameEn: 'Dominant 7th', 
    formula: ['1P', '3M', '5P', '7m'], 
    feelDescription: 'Kêu gọi hút về chủ âm, bluesy', 
    symbolSuffix: '7',
    mnemonicVi: 'Màu sắc nhạc Blues, Rock n Roll cổ điển, thúc giục chuyển hợp âm',
    tipVi: 'Hợp âm Trưởng đi với quãng 7 Thứ, chứa cặp nốt nghịch tritone luôn muốn hút về hợp âm chủ.'
  },
  'm7b5': { 
    type: 'm7b5', 
    nameVi: 'Nửa Giảm (Half-Diminished 7th)', 
    nameEn: 'Half-Diminished 7th', 
    formula: ['1P', '3m', '5d', '7m'], 
    feelDescription: 'Dằn vặt, bí ẩn, jazz noir', 
    symbolSuffix: 'm7b5',
    mnemonicVi: 'Dằn vặt, bí ẩn, điện ảnh trinh thám noir',
    tipVi: 'Hợp âm Giảm nhưng có nốt bậc 7 Thứ. Rất phổ biến ở bậc II trong điệu Thứ của nhạc Jazz.'
  },
  'dim7': { 
    type: 'dim7', 
    nameVi: 'Giảm 7 (Diminished 7th)', 
    nameEn: 'Full Diminished 7th', 
    formula: ['1P', '3m', '5d', '6M'], 
    feelDescription: 'Kinh dị, nghẹt thở, đột biến', 
    symbolSuffix: 'dim7',
    mnemonicVi: 'Cực kỳ căng thẳng, nghẹt thở, cao trào kịch tính',
    tipVi: '4 nốt cách đều nhau đúng 3 nửa cung đối xứng hoàn hảo, cảm giác nguy hiểm tột độ.'
  },
  'sus2': { 
    type: 'sus2', 
    nameVi: 'Treo 2 (Suspended 2nd)', 
    nameEn: 'Suspended 2nd', 
    formula: ['1P', '2M', '5P'], 
    feelDescription: 'Trong trẻo, rộng mở, hiện đại', 
    symbolSuffix: 'sus2',
    mnemonicVi: 'Trong trẻo như giọt sương mai, hiện đại (Pop Acoustic)',
    tipVi: 'Thay nốt bậc 3 bằng bậc 2, làm mất đi tính Trưởng/Thứ, tạo sự rộng mở trong sáng.'
  },
  'sus4': { 
    type: 'sus4', 
    nameVi: 'Treo 4 (Suspended 4th)', 
    nameEn: 'Suspended 4th', 
    formula: ['1P', '4P', '5P'], 
    feelDescription: 'Chờ đợi, háo hức, chưa hồi kết', 
    symbolSuffix: 'sus4',
    mnemonicVi: 'Háo hức đợi chờ hồi kết, lơ lửng mong được giải quyết',
    tipVi: 'Thay nốt bậc 3 bằng bậc 4, nốt bậc 4 tạo sức căng muốn rơi về nốt bậc 3 Trưởng.'
  },
  '9th': { 
    type: '9th', 
    nameVi: 'Hợp âm 9 (Dominant 9th)', 
    nameEn: 'Dominant 9th', 
    formula: ['1P', '3M', '5P', '7m', '9M'], 
    feelDescription: 'Sang trọng, rực rỡ, funk/jazz', 
    symbolSuffix: '9',
    mnemonicVi: 'Sang trọng, rực rỡ, nhún nhảy Funk / R&B hiện đại',
    tipVi: 'Bổ sung thêm nốt quãng 9 mở rộng, âm thanh đầy đặn và sang trọng.'
  }
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

/* ==========================================================================
   M0 & M1: Thuộc Tính & Quan Hệ Nhận Thức Âm Nhạc (KE_HOACH Section 5 & 7)
   ========================================================================== */

// 1. Bồi Âm / Hài Âm (Harmonic Overtones & Partials) - M0-1
export interface IHarmonicOvertoneInfo {
  harmonicNumber: number; // 1 to 5 (or up to 8)
  nameVi: string;
  nameEn: string;
  ratioDescription: string;
  intervalFromRoot: string;
  musicalRoleVi: string;
  tipVi: string;
}

export const HARMONIC_OVERTONES_CATALOG: Record<number, IHarmonicOvertoneInfo> = {
  1: {
    harmonicNumber: 1,
    nameVi: 'Hài 1: Âm Cơ Bản (Fundamental)',
    nameEn: '1st Harmonic (Fundamental)',
    ratioDescription: '1f (Tần số gốc nốt nhạc)',
    intervalFromRoot: 'Đồng âm (Root)',
    musicalRoleVi: 'Quyết định cao độ nhận biết chính của nốt nhạc.',
    tipVi: 'Tần số trầm nhất, chiếm trọng tâm năng lượng của âm thanh.'
  },
  2: {
    harmonicNumber: 2,
    nameVi: 'Hài 2: Bát Độ Thứ Nhất (Octave)',
    nameEn: '2nd Harmonic (1st Octave)',
    ratioDescription: '2f (Tần số gấp đôi 2:1)',
    intervalFromRoot: 'Quãng 8 Đúng (8P)',
    musicalRoleVi: 'Tạo độ sáng trong trẻo và dày dặn cho âm sắc.',
    tipVi: 'Cao hơn âm gốc đúng 1 quãng tám, âm thanh hòa quyện tự nhiên như tiếng sáo.'
  },
  3: {
    harmonicNumber: 3,
    nameVi: 'Hài 3: Quãng 5 Đúng Kép (Twelfth / Perfect 5th)',
    nameEn: '3rd Harmonic (Octave + 5th)',
    ratioDescription: '3f (Tỉ lệ 3:1)',
    intervalFromRoot: 'Quãng 8 + Quãng 5 Đúng (12P)',
    musicalRoleVi: 'Tạo màu sắc kèn đồng (brass), âm thanh có độ đanh và sắc nét.',
    tipVi: 'Chính là nốt bậc 5 ở quãng tám kế tiếp. Khi nhấn mạnh, bạn nghe tiếng "hú" ngọt ngào.'
  },
  4: {
    harmonicNumber: 4,
    nameVi: 'Hài 4: Bát Độ Thứ Hai (Double Octave)',
    nameEn: '4th Harmonic (2nd Octave)',
    ratioDescription: '4f (Tỉ lệ 4:1)',
    intervalFromRoot: '2 Quãng 8 Đúng (15P)',
    musicalRoleVi: 'Mở rộng dải tần cao, tăng cảm giác ngân vang pha lê.',
    tipVi: 'Cách nốt gốc đúng 2 quãng tám (cao hơn 2 tầng âm vực).'
  },
  5: {
    harmonicNumber: 5,
    nameVi: 'Hài 5: Quãng 3 Trưởng Kép (17th / Major 3rd)',
    nameEn: '5th Harmonic (2 Octaves + Major 3rd)',
    ratioDescription: '5f (Tỉ lệ 5:1)',
    intervalFromRoot: '2 Quãng 8 + Quãng 3 Trưởng (17M)',
    musicalRoleVi: 'Nền tảng sinh học tạo ra hợp âm Trưởng tự nhiên trong tự nhiên.',
    tipVi: 'Mang sắc thái ấm áp, tích cực của quãng 3 Trưởng, làm sáng bừng dải treble.'
  }
};

export function generateOvertoneQuestion(
  baseNote = 'C3',
  allowedHarmonics: number[] = [2, 3, 4, 5],
  boostDb = 9
): {
  baseNote: string;
  baseFreq: number;
  boostHarmonicIndex: number;
  boostDb: number;
  targetInfo: IHarmonicOvertoneInfo;
  options: IHarmonicOvertoneInfo[];
} {
  const chosenHarmonic = allowedHarmonics[Math.floor(Math.random() * allowedHarmonics.length)] || 2;
  const targetInfo = HARMONIC_OVERTONES_CATALOG[chosenHarmonic] || HARMONIC_OVERTONES_CATALOG[2];
  const baseFreq = getNoteFrequency(baseNote);

  const options = allowedHarmonics.map(h => HARMONIC_OVERTONES_CATALOG[h]).filter(Boolean);

  return {
    baseNote,
    baseFreq,
    boostHarmonicIndex: chosenHarmonic,
    boostDb,
    targetInfo,
    options
  };
}

// 2. Cách Phát Âm (Articulations) - M0-3
export interface IArticulationInfo {
  type: 'legato' | 'staccato' | 'tenuto' | 'accent';
  nameVi: string;
  nameEn: string;
  symbol: string;
  feelDescription: string;
  musicalTipVi: string;
}

export const ARTICULATIONS_CATALOG: Record<string, IArticulationInfo> = {
  'legato': {
    type: 'legato',
    nameVi: 'Liền Tiếng (Legato)',
    nameEn: 'Legato',
    symbol: '⌒',
    feelDescription: 'Mượt mà, gắn kết, không có khoảng lặng giữa các nốt',
    musicalTipVi: 'Các nốt nhạc gối đầu lên nhau như một dải lụa mềm mại lướt đi êm ả.'
  },
  'staccato': {
    type: 'staccato',
    nameVi: 'Ngắt Tiếng (Staccato)',
    nameEn: 'Staccato',
    symbol: '•',
    feelDescription: 'Bật nảy, dứt khoát, ngắt âm sắc nét chỉ ngân ~35% trường độ',
    musicalTipVi: 'Như những giọt nước mưa rơi lộp độp hoặc bước chân nhón gót tinh nghịch.'
  },
  'tenuto': {
    type: 'tenuto',
    nameVi: 'Ngân Trọn Vẹn (Tenuto)',
    nameEn: 'Tenuto',
    symbol: '—',
    feelDescription: 'Ngân đủ đầy 100% độ dài với áp lực âm thanh đều đặn',
    musicalTipVi: 'Mỗi nốt được kéo dài trọn vẹn, trang trọng và chắc chắn trước khi chuyển nốt.'
  },
  'accent': {
    type: 'accent',
    nameVi: 'Nhấn Trọng Âm (Accent)',
    nameEn: 'Accent',
    symbol: '>',
    feelDescription: 'Tấn công mạnh mẽ ở đầu nốt nhạc (+35% cường độ bộc phát)',
    musicalTipVi: 'Đầu nốt nhạc đập mạnh như tiếng búa gõ dứt khoát rồi lắng dịu dần.'
  }
};

export function generateArticulationQuestion(
  types: Array<'legato' | 'staccato' | 'tenuto' | 'accent'> = ['legato', 'staccato', 'tenuto', 'accent'],
  notes: string[] = ['C4', 'E4', 'G4', 'C5']
): {
  targetType: 'legato' | 'staccato' | 'tenuto' | 'accent';
  targetInfo: IArticulationInfo;
  notes: string[];
  options: IArticulationInfo[];
} {
  const chosenType = types[Math.floor(Math.random() * types.length)];
  const targetInfo = ARTICULATIONS_CATALOG[chosenType];
  const options = types.map(t => ARTICULATIONS_CATALOG[t]);

  return {
    targetType: chosenType,
    targetInfo,
    notes,
    options
  };
}

// 3. Đường Nét Giai Điệu (Melodic Contour - Parsons Code) - M1-1
export interface IMelodicContourInfo {
  type: 'ascend' | 'descend' | 'arch' | 'inverted-arch' | 'flat' | 'wave';
  nameVi: string;
  nameEn: string;
  symbol: string;
  shapeDescriptionVi: string;
  parsonsPattern: Array<'U' | 'D' | 'R'>; // Up, Down, Repeat
}

export const MELODIC_CONTOURS: Record<string, IMelodicContourInfo> = {
  'ascend': {
    type: 'ascend',
    nameVi: 'Đường Lên Liên Tục (Ascending)',
    nameEn: 'Continuous Ascent',
    symbol: '↗',
    shapeDescriptionVi: 'Chuỗi nốt leo dần lên cao từng bước',
    parsonsPattern: ['U', 'U', 'U']
  },
  'descend': {
    type: 'descend',
    nameVi: 'Đường Xuống Liên Tục (Descending)',
    nameEn: 'Continuous Descent',
    symbol: '↘',
    shapeDescriptionVi: 'Chuỗi nốt hạ dần xuống thấp như bậc thang',
    parsonsPattern: ['D', 'D', 'D']
  },
  'arch': {
    type: 'arch',
    nameVi: 'Hình Cầu Vồng (Arch ∧)',
    nameEn: 'Arch Shape',
    symbol: '∧',
    shapeDescriptionVi: 'Giai điệu bay lên đỉnh cao rồi lượn xuống thấp',
    parsonsPattern: ['U', 'U', 'D', 'D']
  },
  'inverted-arch': {
    type: 'inverted-arch',
    nameVi: 'Hình Thung Lũng (Valley ∨)',
    nameEn: 'Inverted Arch',
    symbol: '∨',
    shapeDescriptionVi: 'Giai điệu rơi xuống đáy sâu rồi bốc lên cao',
    parsonsPattern: ['D', 'D', 'U', 'U']
  },
  'flat': {
    type: 'flat',
    nameVi: 'Đường Ngang / Bè Tĩnh (Horizontal —)',
    nameEn: 'Flat / Static Line',
    symbol: '—',
    shapeDescriptionVi: 'Các nốt lặp lại cùng một cao độ giữ nguyên',
    parsonsPattern: ['R', 'R', 'R']
  },
  'wave': {
    type: 'wave',
    nameVi: 'Lượn Sóng Nhấp Nhô (Wave ∿)',
    nameEn: 'Oscillating Wave',
    symbol: '∿',
    shapeDescriptionVi: 'Lên rồi xuống luân phiên nhịp nhàng',
    parsonsPattern: ['U', 'D', 'U', 'D']
  }
};

const DIATONIC_EXTENDED_SCALE = [
  'G3', 'A3', 'B3', 
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5'
];

export function getContourSampleNotes(type: string): string[] {
  switch (type) {
    case 'ascend':
      return ['C4', 'E4', 'G4', 'C5'];
    case 'descend':
      return ['C5', 'A4', 'F4', 'C4'];
    case 'arch':
      return ['C4', 'F4', 'A4', 'F4', 'D4'];
    case 'inverted-arch':
      return ['A4', 'E4', 'C4', 'E4', 'B4'];
    case 'flat':
      return ['G4', 'G4', 'G4', 'G4'];
    case 'wave':
    default:
      return ['E4', 'A4', 'D4', 'G4', 'E4'];
  }
}

export function generateContourQuestion(
  allowedTypes: Array<'ascend' | 'descend' | 'arch' | 'inverted-arch' | 'flat' | 'wave'> = ['ascend', 'descend', 'arch', 'wave']
): {
  targetContour: IMelodicContourInfo;
  notes: string[];
  options: IMelodicContourInfo[];
} {
  const chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  const targetContour = MELODIC_CONTOURS[chosenType];
  const scale = DIATONIC_EXTENDED_SCALE;

  let curIdx = 7; // Default G4
  if (chosenType === 'ascend') {
    // Start low (C4 or D4) so it can strictly ascend
    curIdx = 3 + Math.floor(Math.random() * 2);
  } else if (chosenType === 'descend') {
    // Start high (C5 or D5) so it can strictly descend
    curIdx = 10 + Math.floor(Math.random() * 2);
  } else if (chosenType === 'arch') {
    // Start mid-low (D4) so it can ascend then descend
    curIdx = 4;
  } else if (chosenType === 'inverted-arch') {
    // Start mid-high (B4) so it can descend then ascend
    curIdx = 9;
  } else if (chosenType === 'wave') {
    // Start mid (F4) so it can oscillate
    curIdx = 6;
  }

  const notes = [scale[curIdx]];
  targetContour.parsonsPattern.forEach(dir => {
    if (dir === 'U') {
      const step = 1 + Math.floor(Math.random() * 2);
      curIdx = Math.min(scale.length - 1, curIdx + step);
    } else if (dir === 'D') {
      const step = 1 + Math.floor(Math.random() * 2);
      curIdx = Math.max(0, curIdx - step);
    }
    // 'R' retains curIdx
    notes.push(scale[curIdx]);
  });

  const options = allowedTypes.map(t => MELODIC_CONTOURS[t]);

  return {
    targetContour,
    notes,
    options
  };
}

/**
 * Generate sequence for Level 11 (Octave Leap): features distinct octave jumps
 * challenging pitch chroma vs pitch height perception.
 */
export function generateOctaveLeapSequence(length = 6): string[] {
  const pitchClasses = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const notes: string[] = [];
  let lastPitch = 'C';

  for (let i = 0; i < length; i++) {
    if (i > 0 && (i % 2 === 1 || Math.random() < 0.55)) {
      // Direct octave leap on the previous pitch class!
      const prevNote = notes[i - 1];
      const p = prevNote.slice(0, -1);
      const prevOctave = parseInt(prevNote.slice(-1), 10);
      const newOctave = prevOctave === 4 ? (Math.random() < 0.5 ? 5 : 3) : 4;
      notes.push(`${p}${newOctave}`);
      lastPitch = p;
    } else {
      let p = pitchClasses[Math.floor(Math.random() * pitchClasses.length)];
      while (p === lastPitch) {
        p = pitchClasses[Math.floor(Math.random() * pitchClasses.length)];
      }
      const oct = Math.random() < 0.6 ? 4 : (Math.random() < 0.5 ? 3 : 5);
      notes.push(`${p}${oct}`);
      lastPitch = p;
    }
  }

  return notes;
}

// 4. Nốt Ngoại Điệu (Chromatic Oddball in-key vs out-of-key) - M0-4
export function generateChromaticOddballQuestion(
  keyRoot = 'C4',
  melodyLength = 6
): {
  notes: string[];
  oddballIndex: number;
  oddballNote: string;
  inKeyNotes: string[];
  explanationVi: string;
} {
  const diatonicScale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const chromaticIntruders = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'];

  const oddballIndex = 1 + Math.floor(Math.random() * (melodyLength - 2)); // Not first or last note
  const oddballNote = chromaticIntruders[Math.floor(Math.random() * chromaticIntruders.length)];

  const notes: string[] = [];
  for (let i = 0; i < melodyLength; i++) {
    if (i === oddballIndex) {
      notes.push(oddballNote);
    } else {
      const pick = diatonicScale[Math.floor(Math.random() * diatonicScale.length)];
      notes.push(pick);
    }
  }

  return {
    notes,
    oddballIndex,
    oddballNote,
    inKeyNotes: diatonicScale,
    explanationVi: `Giai điệu đang ở giọng Đô Trưởng (C Major), nốt thứ ${oddballIndex + 1} (${oddballNote}) là nốt thăng ngoại điệu lạ lẫm.`
  };
}

// 5. Kết Đoạn Hòa Âm (Cadences: V-I, x-V, V-vi, IV-I) - M1-4
export interface ICadenceInfo {
  type: 'authentic' | 'half' | 'deceptive' | 'plagal';
  nameVi: string;
  nameEn: string;
  romanFormula: string;
  feelDescription: string;
  explanationVi: string;
  sampleChordsInC: string[][];
}

export const CADENCE_CATALOG: Record<string, ICadenceInfo> = {
  'authentic': {
    type: 'authentic',
    nameVi: 'Kết Trọn (Authentic Cadence)',
    nameEn: 'Authentic Cadence (V → I)',
    romanFormula: 'V → I',
    feelDescription: 'Viên mãn, hoàn tất trọn vẹn, cảm giác hạ màn an lòng',
    explanationVi: 'Hợp âm Át (G) giải quyết triệt để về hợp âm Chủ (C), tạo sự thỏa mãn lớn nhất trong âm nhạc cổ điển và pop.',
    sampleChordsInC: [
      ['G3', 'B3', 'D4', 'G4'], // G (V)
      ['C4', 'E4', 'G4', 'C5']  // C (I)
    ]
  },
  'half': {
    type: 'half',
    nameVi: 'Kết Lửng (Half Cadence)',
    nameEn: 'Half Cadence (I/IV → V)',
    romanFormula: 'I / IV → V',
    feelDescription: 'Lơ lửng, đợi chờ, dấu phẩy đặt câu hỏi chưa có lời đáp',
    explanationVi: 'Tiến trình dừng lại ở hợp âm Át (V), tai người nghe cảm thấy như bài nhạc tạm ngưng giữa câu chờ đoạn tiếp theo.',
    sampleChordsInC: [
      ['C4', 'E4', 'G4'],      // C (I)
      ['G3', 'B3', 'D4', 'G4'] // G (V)
    ]
  },
  'deceptive': {
    type: 'deceptive',
    nameVi: 'Kết Hụt (Deceptive Cadence)',
    nameEn: 'Deceptive Cadence (V → vi)',
    romanFormula: 'V → vi',
    feelDescription: 'Bất ngờ, hẫng hụt, bất an kịch tính chuyển sang Thứ',
    explanationVi: 'Tai người kỳ vọng hợp âm V sẽ giải quyết về I Trưởng tươi sáng, nhưng bất ngờ rơi vào hợp âm Thứ vi (La Thứ), tạo nét u trầm đột ngột.',
    sampleChordsInC: [
      ['G3', 'B3', 'D4', 'G4'], // G (V)
      ['A3', 'C4', 'E4', 'A4']  // Am (vi)
    ]
  },
  'plagal': {
    type: 'plagal',
    nameVi: 'Kết Ngợi Khen (Plagal Cadence)',
    nameEn: 'Plagal Cadence (IV → I)',
    romanFormula: 'IV → I',
    feelDescription: 'Thanh thoát, dịu dàng, âm hưởng giáo đường Amen',
    explanationVi: 'Hợp âm Hạ át (F) nhẹ nhàng trôi về hợp âm Chủ (C), không có lực hút mạnh của nốt dẫn bậc 7 mà mang vẻ êm đềm linh thiêng.',
    sampleChordsInC: [
      ['F3', 'A3', 'C4', 'F4'], // F (IV)
      ['C4', 'E4', 'G4', 'C5']  // C (I)
    ]
  }
};

export function generateCadenceQuestion(
  allowedTypes: Array<'authentic' | 'half' | 'deceptive' | 'plagal'> = ['authentic', 'half', 'deceptive', 'plagal']
): {
  targetCadence: ICadenceInfo;
  chords: string[][];
  options: ICadenceInfo[];
} {
  const chosen = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  const targetCadence = CADENCE_CATALOG[chosen];
  const options = allowedTypes.map(t => CADENCE_CATALOG[t]);

  return {
    targetCadence,
    chords: targetCadence.sampleChordsInC,
    options
  };
}

// 6. Hòa Âm Ngầm (Implied Harmony from broken arpeggio) - M1-6
export function generateImpliedHarmonyQuestion(): {
  chordType: string;
  notes: string[];
  typeInfo: IChordTypeInfo;
  options: IChordTypeInfo[];
} {
  const types = ['Major', 'Minor', 'dom7', 'Diminished'];
  const chosenType = types[Math.floor(Math.random() * types.length)];
  const typeInfo = CHORD_TYPE_CATALOG[chosenType];

  const root = 'C4';
  const notes = typeInfo.formula.map(interval => Note.transpose(root, interval));
  // Arpeggiate melody
  const arpeggioNotes = [...notes, Note.transpose(root, '8P')];

  const options = types.map(t => CHORD_TYPE_CATALOG[t]);

  return {
    chordType: chosenType,
    notes: arpeggioNotes,
    typeInfo,
    options
  };
}

// 7. Theo Dõi Bè Đa Thanh (Voice Tracking Challenge) - M2-1
export interface IVoiceNote {
  note: string;
  durationSec: number;
  rest?: boolean;
}

export interface IVoiceStreamData {
  name: 'soprano' | 'alto' | 'bass';
  displayNameVi: string;
  notes: IVoiceNote[];
  waveform: OscillatorType;
  pan: number;
  volume: number;
  colorHex: string;
}

export interface IVoiceTrackQuestion {
  targetVoice: 'soprano' | 'alto' | 'bass';
  targetVoiceNameVi: string;
  voices: IVoiceStreamData[];
  taskType: 'direction' | 'oddball' | 'timbre';
  questionTextVi: string;
  correctAnswerId: string;
  options: Array<{ id: string; labelVi: string; icon?: string }>;
  explanationVi: string;
}

export function generateVoiceTrackingChallenge(
  voicesCount: 2 | 3 = 2,
  targetVoiceInput?: 'soprano' | 'alto' | 'bass',
  taskType: 'direction' | 'oddball' | 'timbre' = 'direction'
): IVoiceTrackQuestion {
  // Soprano (high: C5 to G5, Pan right +0.35)
  // Alto (mid: G4 to C5, Center Pan 0.0)
  // Bass (low: C3 to G3, Pan left -0.35)
  const voiceRoles: Array<'soprano' | 'alto' | 'bass'> = voicesCount === 3
    ? ['soprano', 'alto', 'bass']
    : ['soprano', 'bass'];

  const targetVoice = targetVoiceInput || voiceRoles[Math.floor(Math.random() * voiceRoles.length)];

  // Choose direction of target voice: 'up' | 'down' | 'flat'
  const directions: Array<'up' | 'down' | 'flat'> = ['up', 'down', 'flat'];
  const targetDirection = directions[Math.floor(Math.random() * directions.length)];

  // Build notes
  let sopranoNotes: string[] = [];
  if (targetVoice === 'soprano') {
    if (targetDirection === 'up') sopranoNotes = ['C5', 'D5', 'E5', 'G5'];
    else if (targetDirection === 'down') sopranoNotes = ['G5', 'E5', 'D5', 'C5'];
    else sopranoNotes = ['E5', 'E5', 'E5', 'E5'];
  } else {
    sopranoNotes = ['E5', 'G5', 'F5', 'E5']; // Counter-melody
  }

  let bassNotes: string[] = [];
  if (targetVoice === 'bass') {
    if (targetDirection === 'up') bassNotes = ['C3', 'E3', 'G3', 'C4'];
    else if (targetDirection === 'down') bassNotes = ['C4', 'G3', 'E3', 'C3'];
    else bassNotes = ['C3', 'C3', 'C3', 'C3'];
  } else {
    bassNotes = ['C3', 'G2', 'A2', 'C3']; // Counter-bass
  }

  let altoNotes: string[] = [];
  if (voicesCount === 3) {
    if (targetVoice === 'alto') {
      if (targetDirection === 'up') altoNotes = ['G4', 'A4', 'B4', 'C5'];
      else if (targetDirection === 'down') altoNotes = ['C5', 'B4', 'A4', 'G4'];
      else altoNotes = ['G4', 'G4', 'G4', 'G4'];
    } else {
      altoNotes = ['G4', 'F4', 'G4', 'A4'];
    }
  }

  const stepDuration = 0.55;

  const voices: IVoiceStreamData[] = [
    {
      name: 'soprano',
      displayNameVi: 'Bè Cao (Soprano)',
      notes: sopranoNotes.map(n => ({ note: n, durationSec: stepDuration })),
      waveform: 'triangle',
      pan: 0.35,
      volume: 0.32,
      colorHex: '#38BDF8' // Sky blue
    },
    {
      name: 'bass',
      displayNameVi: 'Bè Trầm (Bass)',
      notes: bassNotes.map(n => ({ note: n, durationSec: stepDuration })),
      waveform: 'sawtooth',
      pan: -0.35,
      volume: 0.28,
      colorHex: '#F59E0B' // Amber
    }
  ];

  if (voicesCount === 3) {
    voices.splice(1, 0, {
      name: 'alto',
      displayNameVi: 'Bè Giữa (Alto)',
      notes: altoNotes.map(n => ({ note: n, durationSec: stepDuration })),
      waveform: 'sine',
      pan: 0.0,
      volume: 0.34,
      colorHex: '#A855F7' // Purple
    });
  }

  const targetVoiceNameVi = targetVoice === 'soprano' ? 'Bè Cao (Soprano)' : targetVoice === 'bass' ? 'Bè Trầm (Bass)' : 'Bè Giữa (Alto)';

  let correctAnswerId = targetDirection;
  let options = [
    { id: 'up', labelVi: 'Đi Lên Cao (Ascending)', icon: '↗' },
    { id: 'down', labelVi: 'Đi Xuống Thấp (Descending)', icon: '↘' },
    { id: 'flat', labelVi: 'Đứng Yên / Giữ Nguyên (Static)', icon: '—' }
  ];

  let questionTextVi = `Lắng nghe đa bè: ${targetVoiceNameVi} di chuyển theo hướng nào?`;
  let explanationVi = `${targetVoiceNameVi} di chuyển ${
    targetDirection === 'up' ? 'leo dần lên cao' : targetDirection === 'down' ? 'hạ dần xuống thấp' : 'ngân giữ cùng cao độ'
  } giữa các bè đệm còn lại.`;

  return {
    targetVoice,
    targetVoiceNameVi,
    voices,
    taskType,
    questionTextVi,
    correctAnswerId,
    options,
    explanationVi
  };
}

// ============================================================================
// AUDITORY PERCEPTION & EAR TRAINING CHALLENGE GENERATORS
// ============================================================================

export interface IOvertoneChallenge {
  baseNote: string;
  baseFreq: number;
  boostedPartial: number; // 2, 3, 4, 5
  boostedPartialNameVi: string;
  questionTextVi: string;
  options: Array<{ id: string; partialIndex: number; labelVi: string; intervalNameVi: string }>;
  correctAnswerId: string;
  explanationVi: string;
}

export function generateOvertoneChallenge(): IOvertoneChallenge {
  const rootNotes = [
    { note: 'C3', freq: 130.81 },
    { note: 'D3', freq: 146.83 },
    { note: 'F3', freq: 174.61 },
    { note: 'G3', freq: 196.00 }
  ];
  const root = rootNotes[Math.floor(Math.random() * rootNotes.length)];

  // Partial 2 (Octave), 3 (Fifth), 4 (Double Octave), 5 (Major 3rd above double octave)
  const partials = [
    { index: 2, labelVi: 'Hài âm 2 (Quãng 8 trên - Octave)', intervalNameVi: 'Quãng 8' },
    { index: 3, labelVi: 'Hài âm 3 (Quãng 5 trên Quãng 8 - Twelfth)', intervalNameVi: 'Quãng 12 (Quãng 5 + 8)' },
    { index: 4, labelVi: 'Hài âm 4 (Hai Quãng 8 trên - Double Octave)', intervalNameVi: '2 Quãng 8' },
    { index: 5, labelVi: 'Hài âm 5 (Quãng 3 Trưởng trên - 17th)', intervalNameVi: 'Quãng 17 (Quãng 3 + 16)' }
  ];

  const selected = partials[Math.floor(Math.random() * partials.length)];

  return {
    baseNote: root.note,
    baseFreq: root.freq,
    boostedPartial: selected.index,
    boostedPartialNameVi: selected.labelVi,
    questionTextVi: `Lắng nghe bồi âm: Hài âm (Overtone) nào đang được kích thích nổi bật nhất trên nốt nền ${root.note}?`,
    options: partials.map(p => ({
      id: `partial-${p.index}`,
      partialIndex: p.index,
      labelVi: p.labelVi,
      intervalNameVi: p.intervalNameVi
    })),
    correctAnswerId: `partial-${selected.index}`,
    explanationVi: `Khi nốt ${root.note} (${root.freq} Hz) vang lên, hài âm thứ ${selected.index} (${(root.freq * selected.index).toFixed(1)} Hz) tạo nên màu sắc nổi bật (${selected.intervalNameVi}).`
  };
}

export interface IArticulationChallenge {
  notes: string[];
  articulation: 'legato' | 'staccato' | 'tenuto' | 'accent';
  questionTextVi: string;
  options: Array<{ id: string; labelVi: string; descriptionVi: string; icon: string }>;
  correctAnswerId: string;
  explanationVi: string;
}

export function generateArticulationChallenge(): IArticulationChallenge {
  const notePhrases = [
    ['C4', 'E4', 'G4', 'C5'],
    ['D4', 'F#4', 'A4', 'D5'],
    ['G3', 'B3', 'D4', 'G4']
  ];
  const phrase = notePhrases[Math.floor(Math.random() * notePhrases.length)];

  const articulations: Array<'legato' | 'staccato' | 'tenuto' | 'accent'> = ['legato', 'staccato', 'tenuto', 'accent'];
  const target = articulations[Math.floor(Math.random() * articulations.length)];

  const meta = {
    legato: { label: 'Legato (Liền tiếng)', desc: 'Các nốt gối đầu mượt mà, không ngắt quãng', icon: '〰' },
    staccato: { label: 'Staccato (Nảy tiếng)', desc: 'Nốt ngắn gọn, nảy tưng, sắc nét', icon: '•' },
    tenuto: { label: 'Tenuto (Ngân đủ trường độ)', desc: 'Ngân trọn vẹn độ dài của từng phách', icon: '—' },
    accent: { label: 'Accent (Nhấn mạnh đầu nốt)', desc: 'Lực đánh bộc phát mạnh mẽ ở transient đầu', icon: '>' }
  };

  return {
    notes: phrase,
    articulation: target,
    questionTextVi: 'Phân tích cách phát âm (Articulation): Chuỗi nốt vừa vang lên được thể hiện theo kỹ thuật nào?',
    options: articulations.map(a => ({
      id: a,
      labelVi: meta[a].label,
      descriptionVi: meta[a].desc,
      icon: meta[a].icon
    })),
    correctAnswerId: target,
    explanationVi: `Chuỗi nốt được thể hiện bằng kỹ thuật ${meta[target].label}: ${meta[target].desc}.`
  };
}

export interface IMelodicContourChallenge {
  notes: string[];
  contourType: 'UP' | 'DOWN' | 'ARCH' | 'INVERTED_ARCH' | 'REPEAT';
  questionTextVi: string;
  options: Array<{ id: string; labelVi: string; asciiShape: string }>;
  correctAnswerId: string;
  explanationVi: string;
}

export function generateMelodicContourChallenge(): IMelodicContourChallenge {
  const templates = [
    { type: 'UP' as const, notes: ['C4', 'E4', 'G4', 'B4', 'C5'], label: 'Đi Lên Liên Tục (Ascending)', shape: '↗ /' },
    { type: 'DOWN' as const, notes: ['C5', 'A4', 'F4', 'D4', 'C4'], label: 'Đi Xuống Liên Tục (Descending)', shape: '↘ \\' },
    { type: 'ARCH' as const, notes: ['C4', 'G4', 'E5', 'G4', 'C4'], label: 'Hình Cầu Vồng (Arch: Lên rồi Xuống)', shape: '∧ ⌒' },
    { type: 'INVERTED_ARCH' as const, notes: ['G4', 'D4', 'B3', 'D4', 'G4'], label: 'Hình Thung Lũng (Inverted Arch: Xuống rồi Lên)', shape: '∨ ∪' },
    { type: 'REPEAT' as const, notes: ['E4', 'E4', 'E4', 'E4', 'E4'], label: 'Đứng Yên / Lặp Cao Độ (Static Repeat)', shape: '— =' }
  ];

  const selected = templates[Math.floor(Math.random() * templates.length)];

  return {
    notes: selected.notes,
    contourType: selected.type,
    questionTextVi: 'Đường nét giai điệu (Melodic Contour): Hình thái chuyển động tổng thể của câu nhạc là gì?',
    options: templates.map(t => ({
      id: t.type,
      labelVi: t.label,
      asciiShape: t.shape
    })),
    correctAnswerId: selected.type,
    explanationVi: `Giai điệu chuyển động theo dạng ${selected.label} (${selected.notes.join(' -> ')}).`
  };
}

export interface ICadenceChallenge {
  cadenceType: 'AUTHENTIC' | 'HALF' | 'DECEPTIVE' | 'PLAGAL';
  rootNote: string;
  questionTextVi: string;
  options: Array<{ id: string; labelVi: string; romanVi: string; feelVi: string }>;
  correctAnswerId: string;
  explanationVi: string;
}

export function generateCadenceChallenge(): ICadenceChallenge {
  const cadences = [
    { type: 'AUTHENTIC' as const, label: 'Kết Hoàn Toàn (Authentic Cadence)', roman: 'V ⟶ I', feel: 'Dứt khoát, về nhà trọn vẹn, thỏa mãn' },
    { type: 'HALF' as const, label: 'Kết Nửa / Lửng (Half Cadence)', roman: 'I/IV ⟶ V', feel: 'Chưa hết câu, lửng lơ trên Dominant, đòi hỏi tiếp tục' },
    { type: 'DECEPTIVE' as const, label: 'Kết Bất Ngờ / Hụt Hẫng (Deceptive Cadence)', roman: 'V ⟶ vi', feel: 'Tưởng về I nhưng rẽ sang Hợp âm Thứ, đầy bất ngờ' },
    { type: 'PLAGAL' as const, label: 'Kết Amen (Plagal Cadence)', roman: 'IV ⟶ I', feel: 'Êm dịu, trang nghiêm, thanh thản như tiếng chuông nhà thờ' }
  ];

  const target = cadences[Math.floor(Math.random() * cadences.length)];

  return {
    cadenceType: target.type,
    rootNote: 'C',
    questionTextVi: 'Tiến trình kết câu (Cadence): Cặp hợp âm kết thúc mang tính chất hòa âm nào?',
    options: cadences.map(c => ({
      id: c.type,
      labelVi: c.label,
      romanVi: c.roman,
      feelVi: c.feel
    })),
    correctAnswerId: target.type,
    explanationVi: `Đây là tiến trình ${target.label} (${target.roman}): ${target.feel}.`
  };
}

