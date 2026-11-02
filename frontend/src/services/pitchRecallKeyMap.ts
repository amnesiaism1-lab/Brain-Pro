export type PitchRecallInputRule = 
  | 'scale-degrees'  // 1=Đồ, 2=Rê, 3=Mi, 4=Fa, 5=Sol, 6=La, 7=Si, 8=Đố (Mặc định cho văn phòng)
  | 'piano-keys'     // A=C, W=C#, S=D, E=D#, D=E, F=F, T=F#, G=G, Y=G#, H=A, U=A#, J=B, K=C5
  | 'note-letters'   // C, D, E, F, G, A, B
  | 'multiple-choice'; // 1..4 Trắc nghiệm so sánh

export interface PitchKeyDefinition {
  key: string;       // Ký tự hiển thị trên phím
  note: string;      // Tên nốt chuẩn kèm octave, ví dụ 'C4'
  solfege: string;   // Tên xướng âm tiếng Việt, ví dụ 'Đồ'
  label: string;     // Nhãn ngắn, ví dụ '1 Đồ'
  isBlack?: boolean; // Nốt thăng giáng
}

export const noteToSolfege = (noteName: string): string => {
  const pitch = noteName.replace(/[0-9]/g, '');
  const map: Record<string, string> = {
    'C': 'Đồ',
    'C#': 'Đồ#',
    'Db': 'Rêb',
    'D': 'Rê',
    'D#': 'Rê#',
    'Eb': 'Mib',
    'E': 'Mi',
    'F': 'Fa',
    'F#': 'Fa#',
    'Gb': 'Solb',
    'G': 'Sol',
    'G#': 'Sol#',
    'Ab': 'Lab',
    'A': 'La',
    'A#': 'La#',
    'Bb': 'Sib',
    'B': 'Si'
  };
  return map[pitch] || pitch;
};

export const sequenceToSolfege = (notes: string[]): string => {
  return notes.map(noteToSolfege).join(' - ');
};

/**
 * Danh sách phím cho Quy tắc: Bậc âm 1..7 (Solfege)
 * Dùng phím số 1..8 (Hàng phím số hoặc Numpad)
 */
export const SCALE_DEGREE_KEYS: PitchKeyDefinition[] = [
  { key: '1', note: 'C4', solfege: 'Đồ', label: '1 Đồ' },
  { key: '2', note: 'D4', solfege: 'Rê', label: '2 Rê' },
  { key: '3', note: 'E4', solfege: 'Mi', label: '3 Mi' },
  { key: '4', note: 'F4', solfege: 'Fa', label: '4 Fa' },
  { key: '5', note: 'G4', solfege: 'Sol', label: '5 Sol' },
  { key: '6', note: 'A4', solfege: 'La', label: '6 La' },
  { key: '7', note: 'B4', solfege: 'Si', label: '7 Si' },
  { key: '8', note: 'C5', solfege: 'Đố', label: '8 Đố' }
];

/**
 * Danh sách phím cho Quy tắc: Hàng phím Piano (Home Row A S D F G H J K)
 */
export const PIANO_ROW_KEYS: PitchKeyDefinition[] = [
  { key: 'A', note: 'C4', solfege: 'Đồ', label: 'A (Đồ)' },
  { key: 'W', note: 'C#4', solfege: 'Đồ#', label: 'W (Đồ#)', isBlack: true },
  { key: 'S', note: 'D4', solfege: 'Rê', label: 'S (Rê)' },
  { key: 'E', note: 'D#4', solfege: 'Rê#', label: 'E (Rê#)', isBlack: true },
  { key: 'D', note: 'E4', solfege: 'Mi', label: 'D (Mi)' },
  { key: 'F', note: 'F4', solfege: 'Fa', label: 'F (Fa)' },
  { key: 'T', note: 'F#4', solfege: 'Fa#', label: 'T (Fa#)', isBlack: true },
  { key: 'G', note: 'G4', solfege: 'Sol', label: 'G (Sol)' },
  { key: 'Y', note: 'G#4', solfege: 'Sol#', label: 'Y (Sol#)', isBlack: true },
  { key: 'H', note: 'A4', solfege: 'La', label: 'H (La)' },
  { key: 'U', note: 'A#4', solfege: 'La#', label: 'U (La#)', isBlack: true },
  { key: 'J', note: 'B4', solfege: 'Si', label: 'J (Si)' },
  { key: 'K', note: 'C5', solfege: 'Đố', label: 'K (Đố)' }
];

/**
 * Danh sách phím cho Quy tắc: Ký âm chữ cái C D E F G A B
 */
export const NOTE_LETTER_KEYS: PitchKeyDefinition[] = [
  { key: 'C', note: 'C4', solfege: 'Đồ', label: 'C (Đồ)' },
  { key: 'D', note: 'D4', solfege: 'Rê', label: 'D (Rê)' },
  { key: 'E', note: 'E4', solfege: 'Mi', label: 'E (Mi)' },
  { key: 'F', note: 'F4', solfege: 'Fa', label: 'F (Fa)' },
  { key: 'G', note: 'G4', solfege: 'Sol', label: 'G (Sol)' },
  { key: 'A', note: 'A4', solfege: 'La', label: 'A (La)' },
  { key: 'B', note: 'B4', solfege: 'Si', label: 'B (Si)' }
];

/**
 * Tra cứu phím bàn phím ra nốt nhạc dựa trên quy tắc đang chọn
 */
export const mapKeyToNote = (
  rawKey: string,
  rule: PitchRecallInputRule
): string | null => {
  const key = rawKey.toUpperCase();

  if (rule === 'scale-degrees') {
    // Hỗ trợ cả 1..8 và Numpad 1..8
    const numMap: Record<string, string> = {
      '1': 'C4',
      '2': 'D4',
      '3': 'E4',
      '4': 'F4',
      '5': 'G4',
      '6': 'A4',
      '7': 'B4',
      '8': 'C5'
    };
    if (numMap[rawKey]) return numMap[rawKey];
    if (rawKey.startsWith('Numpad') && numMap[rawKey.replace('Numpad', '')]) {
      return numMap[rawKey.replace('Numpad', '')];
    }
    return null;
  }

  if (rule === 'piano-keys') {
    const pianoMap: Record<string, string> = {
      'A': 'C4',
      'W': 'C#4',
      'S': 'D4',
      'E': 'D#4',
      'D': 'E4',
      'F': 'F4',
      'T': 'F#4',
      'G': 'G4',
      'Y': 'G#4',
      'H': 'A4',
      'U': 'A#4',
      'J': 'B4',
      'K': 'C5'
    };
    return pianoMap[key] || null;
  }

  if (rule === 'note-letters') {
    const letterMap: Record<string, string> = {
      'C': 'C4',
      'D': 'D4',
      'E': 'E4',
      'F': 'F4',
      'G': 'G4',
      'A': 'A4',
      'B': 'B4'
    };
    return letterMap[key] || null;
  }

  return null;
};

/**
 * Lấy danh sách phím hiển thị trên UI theo quy tắc
 */
export const getKeyDefinitionsForRule = (rule: PitchRecallInputRule): PitchKeyDefinition[] => {
  switch (rule) {
    case 'scale-degrees':
      return SCALE_DEGREE_KEYS;
    case 'piano-keys':
      return PIANO_ROW_KEYS;
    case 'note-letters':
      return NOTE_LETTER_KEYS;
    case 'multiple-choice':
    default:
      return [];
  }
};

/**
 * Lấy mô tả chi tiết của từng quy tắc
 */
export const RULE_INFO_MAP: Record<PitchRecallInputRule, {
  name: string;
  shortName: string;
  badge: string;
  icon: string;
  desc: string;
  hotkeyGuide: string;
}> = {
  'scale-degrees': {
    name: 'Bậc Âm 1..7 (Solfege)',
    shortName: 'Bậc 1..7',
    badge: '1..7',
    icon: '🔢',
    desc: 'Bấm phím số 1..8 (hoặc Numpad) tương ứng Đồ, Rê, Mi, Fa, Sol, La, Si, Đố. Tối ưu nhất khi ngồi văn phòng vì gõ mù 1 tay dễ dàng.',
    hotkeyGuide: '1=Đồ, 2=Rê, 3=Mi, 4=Fa, 5=Sol, 6=La, 7=Si, 8=Đố'
  },
  'piano-keys': {
    name: 'Hàng Phím Piano (A S D F G H J K)',
    shortName: 'Piano A-K',
    badge: 'A-K',
    icon: '🎹',
    desc: 'Mô phỏng hàng phím đàn piano chuẩn DAW (Home row: A S D F G H J K nốt trắng, W E T Y U nốt đen). Thích hợp cho người quen chơi đàn phím ảo.',
    hotkeyGuide: 'A=C4, W=C#, S=D4, E=D#, D=E4, F=F4, T=F#, G=G4, Y=G#, H=A4, U=A#, J=B4, K=C5'
  },
  'note-letters': {
    name: 'Ký Âm Quốc Tế (C D E F G A B)',
    shortName: 'Nốt C-B',
    badge: 'C-B',
    icon: '🔤',
    desc: 'Gõ trực tiếp các phím chữ cái theo tên nốt nhạc quốc tế. Trực quan với người đã học xướng âm chữ cái.',
    hotkeyGuide: 'C=Đồ, D=Rê, E=Mi, F=Fa, G=Sol, A=La, B=Si'
  },
  'multiple-choice': {
    name: 'Trắc Nghiệm 4 Đáp Án',
    shortName: 'Trắc nghiệm',
    badge: '1..4',
    icon: '📋',
    desc: 'Hiển thị 4 chuỗi nốt để so sánh và lựa chọn bằng phím 1..4 hoặc Alt+1..4.',
    hotkeyGuide: 'Phím 1..4 để chọn phương án'
  }
};
